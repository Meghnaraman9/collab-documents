import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import DocumentCard from '../components/DocumentCard';
import { getAllDocuments, createDocument, deleteDocument } from '../utils/api';
import './Home.css';

export default function Home() {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchDocs();
  }, []);

  const fetchDocs = async () => {
    try {
      const { data } = await getAllDocuments();
      setDocs(data);
    } catch (err) {
      console.error('Failed to load documents:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    setCreating(true);
    try {
      const { data } = await createDocument({ title: 'Untitled Document', content: '' });
      navigate(`/document/${data._id}`);
    } catch (err) {
      console.error('Failed to create document:', err);
      setCreating(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteDocument(id);
      setDocs((prev) => prev.filter((d) => d._id !== id));
    } catch (err) {
      console.error('Failed to delete document:', err);
    }
  };

  const filtered = docs.filter((d) =>
    d.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="home-page">
      <Navbar />
      <main className="home-main">
        <div className="home-header">
          <div className="home-header-left">
            <h1 className="home-title">Your Documents</h1>
            <p className="home-subtitle">Create and collaborate in real time</p>
          </div>
          <button className="create-btn" onClick={handleCreate} disabled={creating}>
            {creating ? (
              <span className="btn-spinner" />
            ) : (
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            )}
            New Document
          </button>
        </div>

        <div className="home-search-wrap">
          <div className="search-box">
            <svg className="search-icon" width="15" height="15" viewBox="0 0 15 15" fill="none">
              <circle cx="6.5" cy="6.5" r="5" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M10.5 10.5l2.5 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <input
              type="text"
              placeholder="Search documents..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="search-input"
            />
          </div>
          {docs.length > 0 && (
            <span className="doc-count">{filtered.length} document{filtered.length !== 1 ? 's' : ''}</span>
          )}
        </div>

        {loading ? (
          <div className="home-loading">
            <div className="loading-skeleton" />
            <div className="loading-skeleton" />
            <div className="loading-skeleton" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="home-empty">
            <div className="empty-icon">
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                <rect x="8" y="6" width="32" height="36" rx="6" fill="#eff6ff" stroke="#2563eb" strokeWidth="1.5"/>
                <rect x="15" y="16" width="18" height="2" rx="1" fill="#2563eb" opacity="0.5"/>
                <rect x="15" y="22" width="14" height="2" rx="1" fill="#2563eb" opacity="0.35"/>
                <rect x="15" y="28" width="10" height="2" rx="1" fill="#2563eb" opacity="0.2"/>
              </svg>
            </div>
            <p className="empty-title">
              {search ? 'No documents found' : 'No documents yet'}
            </p>
            <p className="empty-sub">
              {search ? 'Try a different search term' : 'Create your first document to get started'}
            </p>
            {!search && (
              <button className="create-btn" onClick={handleCreate} style={{ marginTop: 16 }}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                Create Document
              </button>
            )}
          </div>
        ) : (
          <div className="docs-grid">
            {filtered.map((doc) => (
              <DocumentCard key={doc._id} doc={doc} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
