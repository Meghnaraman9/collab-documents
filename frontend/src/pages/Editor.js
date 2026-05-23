import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import Navbar from '../components/Navbar';
import ActiveUsers from '../components/ActiveUsers';
import { getDocument, updateDocument } from '../utils/api';
import { getSocket } from '../utils/socket';
import './Editor.css';

const SAVE_INTERVAL = 3000;

const MODULES = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ color: [] }, { background: [] }],
    [{ list: 'ordered' }, { list: 'bullet' }],
    ['blockquote', 'code-block'],
    ['link'],
    ['clean'],
  ],
};

export default function Editor() {
  const { id } = useParams();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [activeUsers, setActiveUsers] = useState([]);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [typingUsers, setTypingUsers] = useState([]);
  const [userName] = useState(() => {
    const stored = localStorage.getItem('collab-username');
    if (stored) return stored;
    const name = `User${Math.floor(Math.random() * 900 + 100)}`;
    localStorage.setItem('collab-username', name);
    return name;
  });

  const socketRef = useRef(null);
  const saveTimerRef = useRef(null);
  const isRemoteChange = useRef(false);

  useEffect(() => {
    const loadDoc = async () => {
      try {
        const { data } = await getDocument(id);
        setTitle(data.title);
        setContent(data.content);
      } catch (err) {
        console.error('Error loading doc:', err);
      } finally {
        setLoading(false);
      }
    };
    loadDoc();
  }, [id]);

  useEffect(() => {
    if (loading) return;
    const socket = getSocket();
    socketRef.current = socket;
    socket.emit('join-document', { docId: id, userName });
    socket.on('load-document', ({ content: c, title: t }) => { setContent(c); setTitle(t); });
    socket.on('receive-changes', ({ delta }) => { isRemoteChange.current = true; setContent(delta); });
    socket.on('active-users', setActiveUsers);
    socket.on('document-saved', () => { setSaved(true); setTimeout(() => setSaved(false), 2500); });
    socket.on('user-typing', ({ userName: name, socketId }) => {
      setTypingUsers(prev => prev.find(u => u.socketId === socketId) ? prev : [...prev, { name, socketId }]);
      setTimeout(() => setTypingUsers(prev => prev.filter(u => u.socketId !== socketId)), 2000);
    });
    return () => {
      socket.off('load-document'); socket.off('receive-changes');
      socket.off('active-users'); socket.off('document-saved'); socket.off('user-typing');
    };
  }, [id, userName, loading]);

  const triggerSave = useCallback((currentContent, currentTitle) => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      socketRef.current?.emit('save-document', { docId: id, content: currentContent, title: currentTitle, userName });
      updateDocument(id, { content: currentContent, title: currentTitle }).catch(console.error);
    }, SAVE_INTERVAL);
  }, [id, userName]);

  const handleContentChange = (val) => {
    setContent(val);
    setSaved(false);
    if (!isRemoteChange.current) {
      socketRef.current?.emit('send-changes', { docId: id, delta: val, userName });
      socketRef.current?.emit('typing', { docId: id, userName });
    }
    isRemoteChange.current = false;
    triggerSave(val, title);
  };

  const handleTitleChange = (val) => { setTitle(val); setSaved(false); triggerSave(content, val); };
  const handleManualSave = () => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    socketRef.current?.emit('save-document', { docId: id, content, title, userName });
    updateDocument(id, { content, title }).catch(console.error);
  };

  const wordCount = content.replace(/<[^>]+>/g, ' ').trim().split(/\s+/).filter(Boolean).length;

  if (loading) return (
    <div className="editor-page">
      <Navbar showBack />
      <div className="editor-loading"><div className="loading-pulse">Loading document...</div></div>
    </div>
  );

  return (
    <div className="editor-page">
      <Navbar showBack docTitle={title} onTitleChange={handleTitleChange} saved={saved} />
      <div className="editor-layout">
        <div className="editor-main">
          <div className="toolbar-save-row">
            <button className="save-btn" onClick={handleManualSave}>💾 Save</button>
            {typingUsers.length > 0 && (
              <span className="typing-text">{typingUsers.map(u => u.name).join(', ')} is typing...</span>
            )}
          </div>
          <div className="quill-wrapper">
            <ReactQuill theme="snow" value={content} onChange={handleContentChange} modules={MODULES} placeholder="Start writing your document..." />
          </div>
          <div className="editor-footer">
            <span>{wordCount} words</span>
            <span>{activeUsers.length} online</span>
          </div>
        </div>
        <div className="editor-sidebar">
          <ActiveUsers users={activeUsers} />
          <div className="sidebar-info">
            <div className="sidebar-section">
              <div className="sidebar-label">You</div>
              <div className="sidebar-you">
                <span className="you-avatar" style={{ background: '#2563eb' }}>{userName[0].toUpperCase()}</span>
                <span className="you-name">{userName}</span>
              </div>
            </div>
            <div className="sidebar-section">
              <div className="sidebar-label">Auto-save</div>
              <div className="sidebar-auto">Saves every 3 seconds</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}