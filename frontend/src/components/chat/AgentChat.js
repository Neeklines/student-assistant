import React, { useState } from 'react';
import { sendMessageToAgent } from '../../services/chatService';

export default function AgentChat() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // W prawdziwej apce sessionId pobierzesz z kontekstu logowania (np. z JWT)
  const sessionId = "student_123"; 

  const handleSend = async () => {
    if (!input.trim()) return;

    const userText = input;
    setMessages(prev => [...prev, { role: 'user', content: userText }]);
    setInput('');
    setIsLoading(true);

    try {
      const data = await sendMessageToAgent(sessionId, userText);
      setMessages(prev => [...prev, { role: 'model', content: data.response }]);
    } catch (error) {
      console.error("Błąd API:", error);
      setMessages(prev => [...prev, { role: 'model', content: "Ups, wystąpił problem." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full max-w-2xl mx-auto p-4 border rounded shadow-lg">
      {/* Zakładam, że używasz TailwindCSS po konfiguracji w paczkach */}
      <div className="flex-1 overflow-y-auto mb-4 space-y-4">
        {messages.length === 0 && (
            <p className="text-gray-500 text-center mt-10">Zacznij rozmowę ze swoim asystentem!</p>
        )}
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`p-3 rounded-lg max-w-[80%] whitespace-pre-wrap ${
              msg.role === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'
            }`}>
              {msg.content}
            </div>
          </div>
        ))}
        {isLoading && <div className="text-gray-500 text-sm">Agent myśli...</div>}
      </div>
      
      <div className="flex gap-2">
        <input 
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Zaplanujmy mój dzień..."
          className="flex-1 p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button 
          onClick={handleSend} 
          disabled={isLoading}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-blue-300"
        >
          Wyślij
        </button>
      </div>
    </div>
  );
}