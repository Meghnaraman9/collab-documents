const Document = require('../models/Document');

// Track active users per document room: { docId: Set of socket IDs }
const documentRooms = {};

// Track user info: { socketId: { name, color, docId } }
const userInfo = {};

const COLORS = [
  '#E63946', '#2A9D8F', '#E9C46A', '#F4A261', '#457B9D',
  '#6A4C93', '#1982C4', '#8AC926', '#FF595E', '#6A0572',
];

let colorIndex = 0;

function getNextColor() {
  const color = COLORS[colorIndex % COLORS.length];
  colorIndex++;
  return color;
}

function handleSocketConnection(io) {
  io.on('connection', (socket) => {
    console.log(`🔌 Socket connected: ${socket.id}`);

    // Join a document room
    socket.on('join-document', async ({ docId, userName }) => {
      socket.join(docId);

      // Store user info
      const color = getNextColor();
      userInfo[socket.id] = { name: userName || 'Anonymous', color, docId };

      // Track room membership
      if (!documentRooms[docId]) documentRooms[docId] = new Set();
      documentRooms[docId].add(socket.id);

      // Load document from DB
      try {
        let doc = await Document.findById(docId);
        if (doc) {
          socket.emit('load-document', { content: doc.content, title: doc.title });
        }
      } catch (err) {
        console.error('Error loading document:', err);
      }

      // Broadcast updated user list to room
      broadcastUsers(io, docId);

      console.log(`👤 ${userName} joined document ${docId}`);
    });

    // Receive content changes and broadcast to room
    socket.on('send-changes', ({ docId, delta, userName }) => {
      socket.to(docId).emit('receive-changes', { delta, userName });
    });

    // Save document content to DB
    socket.on('save-document', async ({ docId, content, title, userName }) => {
      try {
        await Document.findByIdAndUpdate(docId, {
          content,
          title,
          lastEditedBy: userName || 'Anonymous',
        });
        // Broadcast save confirmation to all in room
        io.to(docId).emit('document-saved', { savedBy: userName, timestamp: new Date() });
      } catch (err) {
        console.error('Error saving document:', err);
      }
    });

    // User is typing
    socket.on('typing', ({ docId, userName }) => {
      socket.to(docId).emit('user-typing', { userName, socketId: socket.id });
    });

    // Cursor position update
    socket.on('cursor-update', ({ docId, position, userName }) => {
      socket.to(docId).emit('cursor-moved', {
        socketId: socket.id,
        position,
        userName,
        color: userInfo[socket.id]?.color,
      });
    });

    // Disconnect
    socket.on('disconnect', () => {
      const user = userInfo[socket.id];
      if (user) {
        const { docId, name } = user;
        if (documentRooms[docId]) {
          documentRooms[docId].delete(socket.id);
          if (documentRooms[docId].size === 0) delete documentRooms[docId];
        }
        delete userInfo[socket.id];
        broadcastUsers(io, docId);
        io.to(docId).emit('user-left', { name, socketId: socket.id });
        console.log(`👋 ${name} left document ${docId}`);
      }
      console.log(`❌ Socket disconnected: ${socket.id}`);
    });
  });
}

function broadcastUsers(io, docId) {
  if (!documentRooms[docId]) return;
  const users = Array.from(documentRooms[docId]).map((sid) => ({
    socketId: sid,
    ...userInfo[sid],
  }));
  io.to(docId).emit('active-users', users);
}

module.exports = { handleSocketConnection };
