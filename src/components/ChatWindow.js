import React, { useState, useRef, useEffect } from 'react';
import { FaUserCircle } from 'react-icons/fa'; // Import user icon
import { useNavigate } from 'react-router-dom'; // Import useNavigate
import './ChatWindow.css';

const ChatWindow = ({ threadId, messages, loading, error, refreshMessages, threadIdInt }) => {
  const [prompt, setPrompt] = useState("");
  const [sending, setSending] = useState(false);
  const [localError, setLocalError] = useState("");
  const [waitingForResponse, setWaitingForResponse] = useState(false);
  const [optimisticUserMsg, setOptimisticUserMsg] = useState(null);
  const [typewriterMsg, setTypewriterMsg] = useState(null); // Pour l'effet typewriter
  const [typewriterContent, setTypewriterContent] = useState("");
  const messagesEndRef = useRef(null);
    const token = localStorage.getItem('token');
  const navigate = useNavigate(); // Initialize navigate
  const [dropdownOpen, setDropdownOpen] = useState(false); // State for dropdown visibility

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, waitingForResponse, optimisticUserMsg, typewriterContent]);

  // Effet typewriter : affiche la réponse IA lettre par lettre
  useEffect(() => {
    if (typewriterMsg && typewriterContent.length < typewriterMsg.length) {
      const timeout = setTimeout(() => {
        setTypewriterContent(typewriterMsg.slice(0, typewriterContent.length + 1));
      }, 18); // Vitesse d'affichage (ms)
      return () => clearTimeout(timeout);
    }
    if (typewriterMsg && typewriterContent.length === typewriterMsg.length) {
      setTimeout(() => {
        setTypewriterMsg(null);
        setTypewriterContent("");
        refreshMessages(false); // Recharge la discussion pour synchroniser
      }, 500);
    }
  }, [typewriterMsg, typewriterContent, refreshMessages]);

  const sendMessage = async () => {
    if (!prompt || !threadId) return;
    setSending(true);
    setLocalError("");
    setOptimisticUserMsg({ prompt }); // Affiche le message utilisateur en attente
    setWaitingForResponse(true); // Affiche immédiatement l'animation IA réfléchit
    try {
      const res = await fetch(`https://www.chifaa.sn/Chiffaa_back/api/test/addMessageToThread`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ userMessage: prompt, threadId }),
      });
      const data = await res.json();
      if (data.success) {
        setPrompt("");
        pollForResponse();
      } else {
        setLocalError("Erreur lors de l'ajout du message");
        setOptimisticUserMsg(null);
        setWaitingForResponse(false);
      }
    } catch (err) {
      setLocalError("Erreur d'envoi : " + err.message);
      setOptimisticUserMsg(null);
      setWaitingForResponse(false);
    }
    setSending(false);
  };

  const pollForResponse = () => {
    const intervalId = setInterval(async () => {
      try {
        console.log("Polling pour la réponse...",threadId,prompt);
        const res = await fetch(`https://www.chifaa.sn/Chiffaa_back/api/test/getFinalResponseAssistant`, {
          method: 'POST',
           headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ prompt: prompt, threadId }),
        });
        if (!res.ok) throw new Error("Polling échoué");
        const data = await res.json();
        if (data.success && data.messages.length > 0) {
          setOptimisticUserMsg(null);
          setWaitingForResponse(false);
          setTypewriterMsg(data.messages[0]); // Lance l'effet typewriter
          setTypewriterContent("");
          clearInterval(intervalId);
        }
      } catch (err) {
        setLocalError("Erreur polling : " + err.message);
        setWaitingForResponse(false);
        setOptimisticUserMsg(null);
        clearInterval(intervalId);
      }
    }, 4000);
  };

  const handleLogout = () => {
    localStorage.removeItem('token'); // Remove token
    navigate('/login'); // Redirect to login
  };

  return (
    <div className="chat-window">
      <div className="chat-header">
        {threadId ? `Fil de discussion #${threadIdInt}` : 'Aucun chat sélectionné'}
        <div className="user-menu" style={{ marginTop: '17px', marginRight: '115px', position: 'fixed' }}>
          <FaUserCircle
            size={30}
            onClick={() => setDropdownOpen(!dropdownOpen)}
            style={{ cursor: 'pointer' }}
          />
          <ul className={`dropdown-menu ${dropdownOpen ? 'open' : ''}`} style={{
            position: 'absolute',
            top: '30px',
            right: '0',
            backgroundColor: 'white',
            border: '1px solid #ccc',
            borderRadius: '4px',
            boxShadow: '0 2px 5px rgba(0, 0, 0, 0.2)',
            zIndex: 1000,
            listStyleType: 'none',
            padding: '0',
            margin: '0'
          }}>
            <li
              className="dropdown-item"
              onClick={handleLogout}
              style={{
                padding: '10px',
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              Déconnexion
            </li>
          </ul>
        </div>
      </div>

      <div className="chat-messages">
        {loading && <div className="loader">Chargement...</div>}
        {messages.map((msg) => (
          <div key={msg.id} className="message">
            {msg.prompt && (
              <div className="user-message styled-user-message"><strong>Vous :</strong> {msg.prompt}</div>
            )}
            {msg.content && (
              <div className="ai-message styled-ai-message">
                <strong>Agent IA :</strong>
                <div className="formatted-content">
                  {msg.content.split(/(?<!\d)\.(?!\d)\s*/).map((line, index) => (
                    <p key={index}>{line.trim()}</p>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
        {optimisticUserMsg && (
          <div className="message">
            <div className="user-message styled-user-message"><strong>Vous :</strong> {optimisticUserMsg.prompt}</div>
          </div>
        )}
        {waitingForResponse && !typewriterMsg && (
          <div className="ai-message ai-thinking styled-ai-thinking">
            <span className="thinking-dots">L'IA réfléchit<span className="dot">.</span><span className="dot">.</span><span className="dot">.</span></span>
          </div>
        )}
        {typewriterMsg && (
          <div className="ai-message styled-ai-message">
            <strong>Agent IA :</strong>
            <div className="formatted-content">
              {typewriterContent}
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {threadId && (
        <div className="chat-input">
          <textarea
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
                setPrompt("");
              }
            }}
            placeholder="Votre message..."
            rows={3}
          />
          <button onClick={sendMessage} disabled={sending || !prompt}>Envoyer</button>
        </div>
      )}

      {(error || localError) && <div className="error-message">{error || localError}</div>}
    </div>
  );
};

export default ChatWindow;