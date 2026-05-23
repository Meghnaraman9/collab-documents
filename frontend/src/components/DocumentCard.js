import React from 'react';
import { useNavigate } from 'react-router-dom';
import './DocumentCard.css';

export default function DocumentCard({ doc, onDelete }) {
  const navigate = useNavigate();

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getPreview = (content) => {
    if (!content) return 'No content yet...';
    const text = content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    return text.length > 90 ? text.slice(0, 90) + '...' : text || 'No content yet...';
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    if (window.confirm('Delete this document?')) onDelete(doc._id);
  };

  return (
    <div className="doc-card" onClick={() => navigate(`/document/${doc._id}`)}>
      <div className="doc-card-icon">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <rect x="3" y="2" width="14" height="16" rx="3" fill="#eff6ff" stroke="#2563eb" strokeWidth="1.2"/>
          <rect x="6" y="7" width="8" height="1.2" rx="0.6" fill="#2563eb" opacity="0.7"/>
          <rect x="6" y="10" width="6" height="1.2" rx="0.6" fill="#2563eb" opacity="0.5"/>
          <rect x="6" y="13" width="4" height="1.2" rx="0.6" fill="#2563eb" opacity="0.3"/>
        </svg>
      </div>

      <div className="doc-card-body">
        <h3 className="doc-card-title">{doc.title || 'Untitled Document'}</h3>
        <p className="doc-card-preview">{getPreview(doc.content)}</p>
        <div className="doc-card-meta">
          <span className="doc-date">Edited {formatDate(doc.updatedAt)}</span>
          {doc.lastEditedBy && (
            <span className="doc-editor">by {doc.lastEditedBy}</span>
          )}
        </div>
      </div>

      <button className="doc-delete-btn" onClick={handleDelete} title="Delete document">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M2 3.5h10M5.5 3.5V2.5a.5.5 0 01.5-.5h2a.5.5 0 01.5.5v1M5.5 6v4M8.5 6v4M3 3.5l.7 8a.5.5 0 00.5.5h5.6a.5.5 0 00.5-.5l.7-8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
    </div>
  );
}
