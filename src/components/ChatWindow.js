import React, { useState, useRef, useEffect } from 'react';
import './ChatWindow.css';

const ChatWindow = ({ threadId, messages, loading, error, refreshMessages }) => {
  const [prompt, setPrompt] = useState("");
  const [sending, setSending] = useState(false);
  const [localError, setLocalError] = useState("");
  const [waitingForResponse, setWaitingForResponse] = useState(false);
  const [optimisticUserMsg, setOptimisticUserMsg] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, waitingForResponse, optimisticUserMsg]);

  const sendMessage = async () => {
    if (!prompt || !threadId) return;
    setSending(true);
    setLocalError("");
    setOptimisticUserMsg({ prompt }); // Affiche le message utilisateur en attente

    try {
      const res = await fetch(`https://www.chifaa.sn/Chiffaa_back/api/test/addMessageToThread`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userMessage: prompt, threadId }),
      });

      const data = await res.json();
      if (data.success) {
        setPrompt("");
        setWaitingForResponse(true);
        pollForResponse();
      } else {
        setLocalError("Erreur lors de l'ajout du message");
        setOptimisticUserMsg(null);
      }
    } catch (err) {
      setLocalError("Erreur d'envoi : " + err.message);
      setOptimisticUserMsg(null);
    }
    setSending(false);
  };

  const pollForResponse = () => {
    const intervalId = setInterval(async () => {
      try {
        const res = await fetch(`https://www.chifaa.sn/Chiffaa_back/api/test/getFinalResponseAssistant/${threadId}/${prompt}`);
        if (!res.ok) throw new Error("Polling échoué");
        const data = await res.json();
        if (data.success && data.messages.length > 0) {
          refreshMessages(); // Recharge la vraie liste depuis le parent
          setWaitingForResponse(false);
          setOptimisticUserMsg(null);
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

  return (
    <div className="chat-window">
      <div className="chat-header">
        {threadId ? `Fil de discussion #${threadId}` : 'Aucun chat sélectionné'}
      </div>

      <div className="chat-messages">
        {loading && <div className="loader">Chargement...</div>}
        {messages.map((msg) => (
          <div key={msg.id} className="message">
            {msg.prompt && (
              <div className="user-message"><strong>Vous :</strong> {msg.prompt}</div>
            )}
            {msg.content && (
              <div className="ai-message"><strong>IA :</strong> {msg.content}</div>
            )}
          </div>
        ))}
        {optimisticUserMsg && (
          <div className="message">
            <div className="user-message"><strong>Vous :</strong> {optimisticUserMsg.prompt}</div>
          </div>
        )}
        {waitingForResponse && (
          <div className="ai-message ai-thinking">
            <span className="thinking-dots">L'IA réfléchit<span className="dot">.</span><span className="dot">.</span><span className="dot">.</span></span>
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