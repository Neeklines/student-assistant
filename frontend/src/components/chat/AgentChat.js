import React, { useState, useRef } from 'react';
import { sendMessageToAgent } from '../../services/chatService';

export default function AgentChat() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);

  const sessionId = "student_123";

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    e.target.value = '';
  };

  const clearImage = () => {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImageFile(null);
    setImagePreview(null);
  };

  const handleSend = async () => {
    if (!input.trim() && !imageFile) return;

    const userText = input;
    const sentImagePreview = imagePreview;

    setMessages(prev => [...prev, { role: 'user', content: userText, imagePreview: sentImagePreview }]);
    setInput('');
    clearImage();
    setIsLoading(true);

    try {
      const data = await sendMessageToAgent(sessionId, userText, imageFile);
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
      <div className="flex-1 overflow-y-auto mb-4 space-y-4">
        {messages.length === 0 && (
          <p className="text-gray-500 text-center mt-10">Zacznij rozmowę ze swoim asystentem!</p>
        )}
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`p-3 rounded-lg max-w-[80%] whitespace-pre-wrap ${
              msg.role === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'
            }`}>
              {msg.imagePreview && (
                <img
                  src={msg.imagePreview}
                  alt="załącznik"
                  className="mb-2 max-h-48 rounded object-contain"
                />
              )}
              {msg.content && <span>{msg.content}</span>}
            </div>
          </div>
        ))}
        {isLoading && <div className="text-gray-500 text-sm">Agent myśli...</div>}
      </div>

      {imagePreview && (
        <div className="relative inline-flex mb-2 w-fit">
          <img src={imagePreview} alt="podgląd" className="h-20 rounded border object-contain" />
          <button
            onClick={clearImage}
            className="absolute -top-2 -right-2 bg-gray-700 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs leading-none"
          >
            ×
          </button>
        </div>
      )}

      <div className="flex gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageSelect}
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current.click()}
          title="Dodaj zdjęcie"
          className="px-3 py-2 border rounded text-gray-600 hover:bg-gray-100"
        >
          📎
        </button>
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
