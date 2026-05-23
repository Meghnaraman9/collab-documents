import React from 'react';
import './ActiveUsers.css';

export default function ActiveUsers({ users }) {
  if (!users || users.length === 0) return null;

  return (
    <div className="active-users">
      <div className="au-label">Online now</div>
      <div className="au-list">
        {users.map((user) => (
          <div key={user.socketId} className="au-item" title={user.name}>
            <span
              className="au-avatar"
              style={{ background: user.color || '#2563eb' }}
            >
              {user.name ? user.name[0].toUpperCase() : '?'}
            </span>
            <span className="au-name">{user.name}</span>
            <span className="au-dot" style={{ background: user.color || '#2563eb' }} />
          </div>
        ))}
      </div>
    </div>
  );
}
