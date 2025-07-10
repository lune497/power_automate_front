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
  const userId = localStorage.getItem('userId');

  useEffect(() => {
    if (!token) {
      navigate('/login'); // Redirect to login if no token
    } else {
      fetchThreads();
    }
  }, [token, navigate]); // Added missing dependencies

  const fetchThreads = async () => {
    try {
      const res = await fetch(`https://www.chifaa.sn/Chiffaa_back/graphql?query={threads(user_id:${userId}){id,thread_id}}`, {
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

  const handleThreadSelect = async (numericId, stringId, showLoader = true) => {
    setSelectedThread(stringId);       // pour REST (OpenAI, etc.)
    setSelectedThreadId(numericId);    // pour GraphQL
    if (showLoader) setLoading(true);
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
    if (showLoader) setLoading(false);
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
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (data.success) {
        // On recharge les threads de l'utilisateur et sélectionne le dernier thread créé
        const threadsRes = await fetch(`https://www.chifaa.sn/Chiffaa_back/graphql?query={threads(user_id:${userId}){id,thread_id}}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });
        const threadsData = await threadsRes.json();
        const newThreads = threadsData.data.threads;
        setThreads(newThreads);
        // Cherche le thread avec le thread_id retourné par l'API
        const newThread = newThreads.find(t => t.thread_id === data.thread_id);
        if (newThread) {
          setSelectedThread(newThread.thread_id);
          setSelectedThreadId(newThread.id);
        } else if (newThreads.length > 0) {
          // fallback: sélectionne le dernier thread de la liste
          const lastThread = newThreads[newThreads.length - 1];
          setSelectedThread(lastThread.thread_id);
          setSelectedThreadId(lastThread.id);
        }
      } else {
        setError("Impossible de créer un nouveau chat");
      }
    } catch (err) {
      setError("Erreur lors de la création du thread : " + err.message);
    }
    setLoading(false);
  };

  // Permet à ChatWindow d'ajouter un message IA à la liste globale
  const addMessage = (message) => {
    setMessages(prev => [...prev, message]);
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
              refreshMessages={(showLoader) => handleThreadSelect(selectedThreadId, selectedThread, showLoader)}
              onAddMessage={addMessage}
            />
          </div>
        }
      />
    </Routes>
  );
}

export default App;
