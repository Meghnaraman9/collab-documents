import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import ActiveUsers from '../components/ActiveUsers';
import { getDocument, updateDocument } from '../utils/api';
import { getSocket } from '../utils/socket';
import './Editor.css';

const SAVE_INTERVAL = 3000;

export default function Editor() {
  const { id } = useParams();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [activeUsers, setActiveUsers] = useState([]);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userName] = useState(() => {
    const stored = localStorage.getItem('collab-username');
    if (stored) return stored;
    const name = `User${Math.floor(Math.random() * 900 + 100)}`;
    localStorage.setItem('collab-username', name);
    return name;
  });
  const [typingUsers, setTypingUsers] = useState([]);

  const socketRef = useRef(null);
  const saveTimerRef = useRef(null);
  const typingTimerRef = useRef(null);
  const isRemoteChange = useRef(false);
  const editorRef = useRef(null);

  // Load document
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

  // Socket setup
  useEffect(() => {
    if (loading) return;
    const socket = getSocket();
    socketRef.current = socket;

    socket.emit('join-document', { docId: id, userName });

    socket.on('load-document', ({ content: serverContent, title: serverTitle }) => {
      setContent(serverContent);
      setTitle(serverTitle);
    });

    socket.on('receive-changes', ({ delta }) => {
      isRemoteChange.current = true;
      setContent(delta);
    });

    socket.on('active-users', (users) => {
      setActiveUsers(users);
    });

    socket.on('document-saved', () => {
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    });

    socket.on('user-typing', ({ userName: name, socketId }) => {
      setTypingUsers((prev) => {
        if (prev.find((u) => u.socketId === socketId)) return prev;
        return [...prev, { name, socketId }];
      });
      setTimeout(() => {
        setTypingUsers((prev) => prev.filter((u) => u.socketId !== socketId));
      }, 2000);
    });

    socket.on('user-left', ({ name }) => {
      console.log(`${name} left`);
    });

    return () => {
      socket.off('load-document');
      socket.off('receive-changes');
      socket.off('active-users');
      socket.off('document-saved');
      socket.off('user-typing');
      socket.off('user-left');
    };
  }, [id, userName, loading]);

  // Auto-save
  const triggerSave = useCallback(
    (currentContent, currentTitle) => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => {
        socketRef.current?.emit('save-document', {
          docId: id,
          content: currentContent,
          title: currentTitle,
          userName,
        });
        updateDocument(id, { content: currentContent, title: currentTitle }).catch(console.error);
      }, SAVE_INTERVAL);
    },
    [id, userName]
  );

  const handleContentChange = (e) => {
    const val = e.target.value;
    setContent(val);
    setSaved(false);

    if (!isRemoteChange.current) {
      socketRef.current?.emit('send-changes', { docId: id, delta: val, userName });

      // Typing indicator
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      socketRef.current?.emit('typing', { docId: id, userName });
    }
    isRemoteChange.current = false;
    triggerSave(val, title);
  };

  const handleTitleChange = (val) => {
    setTitle(val);
    setSaved(false);
    triggerSave(content, val);
  };

  const handleManualSave = () => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    socketRef.current?.emit('save-document', { docId: id, content, title, userName });
    updateDocument(id, { content, title }).catch(console.error);
  };

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const charCount = content.length;

  // Toolbar actions
  const insertText = (before, after = '') => {
    const el = editorRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = content.slice(start, end);
    const newContent =
      content.slice(0, start) + before + selected + after + content.slice(end);
    setContent(newContent);
    triggerSave(newContent, title);
    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + before.length, end + before.length);
    }, 0);
  };

  if (loading) {
    return (
      <div className="editor-page">
        <Navbar showBack />
        <div className="editor-loading">
          <div className="loading-pulse">Loading document...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="editor-page">
      <Navbar
        showBack
        docTitle={title}
        onTitleChange={handleTitleChange}
        saved={saved}
      />

      <div className="editor-layout">
        {/* Main editor area */}
        <div className="editor-main">
          {/* Toolbar */}
          <div className="toolbar">
            <div className="toolbar-group">
              <button className="tb-btn" title="Bold" onClick={() => insertText('**', '**')}>
                <strong>B</strong>
              </button>
              <button className="tb-btn tb-italic" title="Italic" onClick={() => insertText('_', '_')}>
                <em>I</em>
              </button>
              <button className="tb-btn" title="Heading" onClick={() => insertText('## ')}>
                H
              </button>
              <button className="tb-btn" title="Bullet list" onClick={() => insertText('- ')}>
                •
              </button>
              <button className="tb-btn" title="Numbered list" onClick={() => insertText('1. ')}>
                1.
              </button>
              <button className="tb-btn" title="Code" onClick={() => insertText('`', '`')}>
                {'</>'}
              </button>
              <button className="tb-btn" title="Quote" onClick={() => insertText('> ')}>
                "
              </button>
            </div>
            <div className="toolbar-right">
              <button className="save-btn" onClick={handleManualSave}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M2 2h8l2 2v8a1 1 0 01-1 1H3a1 1 0 01-1-1V2z" stroke="currentColor" strokeWidth="1.3"/>
                  <rect x="4" y="2" width="4" height="3" rx="0.5" stroke="currentColor" strokeWidth="1.3"/>
                  <rect x="3.5" y="7.5" width="7" height="4" rx="0.5" stroke="currentColor" strokeWidth="1.3"/>
                </svg>
                Save
              </button>
            </div>
          </div>

          {/* Typing indicator */}
          {typingUsers.length > 0 && (
            <div className="typing-indicator">
              <span className="typing-dots">
                <span /><span /><span />
              </span>
              <span className="typing-text">
                {typingUsers.map((u) => u.name).join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
              </span>
            </div>
          )}

          {/* Editor textarea */}
          <textarea
            ref={editorRef}
            className="editor-textarea"
            value={content}
            onChange={handleContentChange}
            placeholder={`Start writing your document...\n\nTip: Use ** for bold, _ for italic, ## for heading, - for list items`}
            spellCheck
          />

          {/* Footer stats */}
          <div className="editor-footer">
            <span>{wordCount} words</span>
            <span>{charCount} characters</span>
            <span>{activeUsers.length} online</span>
          </div>
        </div>

        {/* Sidebar */}
        <div className="editor-sidebar">
          <ActiveUsers users={activeUsers} />

          <div className="sidebar-info">
            <div className="sidebar-section">
              <div className="sidebar-label">You</div>
              <div className="sidebar-you">
                <span
                  className="you-avatar"
                  style={{ background: '#2563eb' }}
                >
                  {userName[0].toUpperCase()}
                </span>
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
