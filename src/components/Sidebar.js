// src/components/Sidebar.js
import React from 'react';
import './Sidebar.css';
import { FaHeadset } from 'react-icons/fa'; // Import headset icon

const Sidebar = ({ threads, onThreadSelect, onNewChat, selectedThread }) => {
  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <button onClick={onNewChat} className="new-chat-btn">Nouveau Chat +</button>
        <h2>
          <FaHeadset /> Assistant IA
        </h2>
        <p className="lvdc-text">LVDC</p> {/* Move LVDC below Assistant IA and center it */}
      </div>
      <div className="thread-list">
        {threads.map(thread => (
          <div
            key={thread.thread_id}
            className={`thread-item ${selectedThread === thread.thread_id ? 'active' : ''}`}
            onClick={() => onThreadSelect(thread.id, thread.thread_id)} // 🟢 on envoie id (int) + thread_id (string)
          >
            Fil de discussion #{thread.id}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Sidebar;
