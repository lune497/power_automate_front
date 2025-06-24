import React, { useState } from 'react';
import logo from './logo.svg';
import './App.css';

function App() {
  const [prompt, setPrompt] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);

  const handlePromptChange = (e) => setPrompt(e.target.value);

  const handleSend = async () => {
    setLoading(true);
    setResponse("");
    try {
      const res = await fetch('http://localhost/script/public/test/apipowerbi', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question: prompt }),
      });
      if (!res.ok) throw new Error('Erreur API');
      const data = await res.json();
      // On récupère le texte dans data.data.reponse (tableau)
      const texte = Array.isArray(data.data?.reponse) ? data.data.reponse.join('\n\n') : JSON.stringify(data.data, null, 2);
      setResponse(texte);
    } catch (err) {
      setResponse("Erreur lors de la requête : " + err.message);
    }
    setLoading(false);
  };

  return (
    <div className="App">
      <header className="App-header">
        {/* <img src={logo} className="App-logo" alt="logo" /> */}
        <h1>Assistant IA</h1>
        <div className="prompt-container">
          <input
            className="prompt-input"
            type="text"
            placeholder="Écrivez votre prompt..."
            value={prompt}
            onChange={handlePromptChange}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
          />
          <button className="send-btn" onClick={handleSend} disabled={loading || !prompt}>
            {loading ? 'Envoi...' : 'Envoyer'}
          </button>
        </div>
        <div className="response-container">
          {loading && <div className="loader"></div>}
          {response && <div className="response-bubble">{response}</div>}
        </div>
      </header>
    </div>
  );
}

export default App;