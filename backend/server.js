 require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST', 'PUT', 'DELETE'] },
});

app.use(cors({ origin: '*' }));
app.use(express.json());

const docs = {};
function now() { return new Date().toISOString(); }
function makeDoc(title = 'Untitled Document', content = '') {
  const id = uuidv4();
  docs[id] = { _id: id, title, content, lastEditedBy: '', createdAt: now(), updatedAt: now() };
  return docs[id];
}

app.get('/api/health', (req, res) => res.json({ status: 'OK' }));
app.get('/api/documents', (req, res) => {
  res.json(Object.values(docs).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)));
});
app.get('/api/documents/:id', (req, res) => {
  const doc = docs[req.params.id];
  if (!doc) return res.status(404).json({ error: 'Not found' });
  res.json(doc);
});
app.post('/api/documents', (req, res) => {
  res.status(201).json(makeDoc(req.body.title, req.body.content));
});
app.put('/api/documents/:id', (req, res) => {
  const doc = docs[req.params.id];
  if (!doc) return res.status(404).json({ error: 'Not found' });
  if (req.body.title !== undefined) doc.title = req.body.title;
  if (req.body.content !== undefined) doc.content = req.body.content;
  doc.updatedAt = now();
  res.json(doc);
});
app.delete('/api/documents/:id', (req, res) => {
  if (!docs[req.params.id]) return res.status(404).json({ error: 'Not found' });
  delete docs[req.params.id];
  res.json({ message: 'Deleted' });
});

const rooms = {};
const users = {};
const COLORS = ['#E63946','#2A9D8F','#E9C46A','#F4A261','#457B9D','#6A4C93','#1982C4','#8AC926'];
let ci = 0;

io.on('connection', (socket) => {
  socket.on('join-document', ({ docId, userName }) => {
    socket.join(docId);
    users[socket.id] = { name: userName || 'Anonymous', color: COLORS[ci++ % COLORS.length], docId };
    if (!rooms[docId]) rooms[docId] = new Set();
    rooms[docId].add(socket.id);
    const doc = docs[docId];
    if (doc) socket.emit('load-document', { content: doc.content, title: doc.title });
    broadcastUsers(io, docId);
  });
  socket.on('send-changes', ({ docId, delta }) => {
    socket.to(docId).emit('receive-changes', { delta });
  });
  socket.on('save-document', ({ docId, content, title, userName }) => {
    const doc = docs[docId];
    if (doc) { doc.content = content; doc.title = title; doc.lastEditedBy = userName || ''; doc.updatedAt = now(); }
    io.to(docId).emit('document-saved', { savedBy: userName, timestamp: new Date() });
  });
  socket.on('typing', ({ docId, userName }) => {
    socket.to(docId).emit('user-typing', { userName, socketId: socket.id });
  });
  socket.on('disconnect', () => {
    const u = users[socket.id];
    if (u) {
      const { docId, name } = u;
      rooms[docId]?.delete(socket.id);
      if (rooms[docId]?.size === 0) delete rooms[docId];
      delete users[socket.id];
      broadcastUsers(io, docId);
      io.to(docId).emit('user-left', { name, socketId: socket.id });
    }
  });
});

function broadcastUsers(io, docId) {
  if (!rooms[docId]) return;
  io.to(docId).emit('active-users', Array.from(rooms[docId]).map(sid => ({ socketId: sid, ...users[sid] })));
}

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  setInterval(() => { http.get(`http://localhost:${PORT}/api/health`, () => {}); }, 14 * 60 * 1000);
});