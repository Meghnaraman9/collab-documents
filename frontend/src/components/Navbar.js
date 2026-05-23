import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Navbar.css';

export default function Navbar({ showBack = false, docTitle = '', onTitleChange, saved }) {
  const navigate = useNavigate();

  return (
    <nav className="navbar">
      <div className="navbar-left">
        <Link to="/" className="navbar-logo">
          <span className="logo-icon">
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <rect x="2" y="2" width="18" height="18" rx="4" fill="#2563eb" opacity="0.15"/>
              <rect x="5" y="6" width="12" height="1.5" rx="0.75" fill="#2563eb"/>
              <rect x="5" y="10" width="9" height="1.5" rx="0.75" fill="#2563eb"/>
              <rect x="5" y="14" width="7" height="1.5" rx="0.75" fill="#2563eb"/>
            </svg>
          </span>
          <span className="logo-text">Collab Documents</span>
        </Link>

        {showBack && (
          <button className="back-btn" onClick={() => navigate('/')}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            All Docs
          </button>
        )}
      </div>

      {showBack && (
        <div className="navbar-center">
          <input
            className="title-input"
            value={docTitle}
            onChange={(e) => onTitleChange && onTitleChange(e.target.value)}
            placeholder="Untitled Document"
          />
          {saved && <span className="saved-badge">✓ Saved</span>}
        </div>
      )}

      <div className="navbar-right">
        <span className="nav-tagline">Real-time collaboration</span>
      </div>
    </nav>
  );
}
