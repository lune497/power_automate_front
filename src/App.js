// src/App.js
import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom'; // Updated imports
import Sidebar from './components/Sidebar';
import ChatWindow from './components/ChatWindow';
import Login from './pages/Login';
import './App.css';

function App() {
  const [threads, setThreads] = useState([]);
  const [selectedThread, setSelectedThread] = useState(null);
  const [selectedThreadId, setSelectedThreadId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate(); // Use navigate hook
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (!token) {
      navigate('/login'); // Redirect to login if no token
    } else {
      fetchThreads();
    }
  }, [token, navigate]); // Added missing dependencies

  const fetchThreads = async () => {
    try {
      const res = await fetch('https://www.chifaa.sn/Chiffaa_back/graphql?query={threads{id,thread_id}}', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      setThreads(data.data.threads);
    } catch (err) {
      setError("Erreur lors du chargement des threads : " + err.message);
    }
  };

  const handleThreadSelect = async (numericId, stringId) => {
    setSelectedThread(stringId);       // pour REST (OpenAI, etc.)
    setSelectedThreadId(numericId);    // pour GraphQL
    setLoading(true);
    setMessages([]); // Vide les messages pour forcer le rafraîchissement visuel
    try {
      const res = await fetch(`https://www.chifaa.sn/Chiffaa_back/graphql?query={messages(thread_id:${numericId}){id,prompt,message_id,content}}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      setMessages(data.data.messages);
    } catch (err) {
      setError("Erreur lors du chargement des messages : " + err.message);
    }
    setLoading(false);
  };

  const handleNewChat = async () => {
    setMessages([]);
    setSelectedThread(null);
    setSelectedThreadId(null);
    setLoading(true);
    try {
      const res = await fetch('https://www.chifaa.sn/Chiffaa_back/api/test/createThread', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (data.success) {
        await fetchThreads();
        setSelectedThread(data.thread_id);
      } else {
        setError("Impossible de créer un nouveau chat");
      }
    } catch (err) {
      setError("Erreur lors de la création du thread : " + err.message);
    }
    setLoading(false);
  };

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <div className="App">
            <Sidebar
              threads={threads}
              onThreadSelect={(id, thread_id) => handleThreadSelect(id, thread_id)}
              onNewChat={handleNewChat}
              selectedThread={selectedThread}
            />
            <ChatWindow
              threadId={selectedThread}
              threadIdInt={selectedThreadId}
              messages={messages}
              loading={loading}
              error={error}
              refreshMessages={() => handleThreadSelect(selectedThreadId, selectedThread)}
            />
          </div>
        }
      />
    </Routes>
  );
}

export default App;
