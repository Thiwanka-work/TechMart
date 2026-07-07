import React, { useState, useEffect, useRef } from 'react';
import api from '../api/axios';

const MartBuddyChat = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState([
    {
      sender: 'buddy',
      text: "Hello! I'm **MartBuddy**, your personal AI Shopping Assistant and Tech Consultant. 🤖\n\nHow can I help you find the absolute best device today? Feel free to ask me to compare devices in stock, suggest products matching your budget, or check features!"
    }
  ]);

  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isLoading]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || isLoading) return;

    const userMsg = inputText;
    setInputText('');

    // 1. Append user message
    setMessages(prev => [...prev, { sender: 'user', text: userMsg }]);
    setIsLoading(true);

    try {
      // 2. Post to backend chat API which links to Gemini with live DB context
      const response = await api.post('/chat', { message: userMsg });
      const botResponse = response.data?.response || "I couldn't fetch an answer right now. Please try again.";
      
      // 3. Append bot response
      setMessages(prev => [...prev, { sender: 'buddy', text: botResponse }]);
    } catch (err) {
      console.error('MartBuddy chat call failed.', err);
      const errorMsg = err.response?.data?.message || "Oops! I ran into an issue connecting to the servers. Please verify that the backend is active and the API Key is configured.";
      setMessages(prev => [...prev, { sender: 'buddy', text: `⚠️ **Error:** ${errorMsg}` }]);
    } finally {
      setIsLoading(false);
    }
  };

  const formatText = (text) => {
    if (!text) return "";
    
    // Convert bold styling **text** and bullet indicators
    let formatted = text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/###\s+(.*)/g, '<h4 class="text-xs font-bold text-slate-200 mt-2 mb-1">$1</h4>')
      .replace(/##\s+(.*)/g, '<h3 class="text-xs font-black text-white mt-3 mb-1.5 uppercase tracking-wider">$1</h3>');

    return formatted.split('\n').map((line, idx) => {
      let trimmed = line.trim();
      if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        return `<li class="ml-4 list-disc text-slate-300 text-[11px] mt-0.5">${trimmed.substring(2)}</li>`;
      }
      return trimmed ? `<p class="mb-1.5 leading-relaxed text-[11px]">${line}</p>` : '';
    }).join('');
  };

  return (
    <>
      {/* Floating Action Button (FAB) */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-gradient-to-r from-blue-600 to-purple-650 text-white rounded-full flex items-center justify-center shadow-xl hover:scale-105 active:scale-95 transition duration-200 cursor-pointer animate-float animate-glow"
        title="Chat with MartBuddy"
      >
        <svg className="w-7.5 h-7.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m18 0h-2M6 20h12a2 2 0 002-2V9a2 2 0 00-2-2H6a2 2 0 00-2 2v9a2 2 0 002 2zM9 11h.01M15 11h.01M10 15h4" />
        </svg>
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-96 h-[480px] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden animate-fade-in animate-scale-in">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-650 p-4 text-white flex justify-between items-center shadow">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m18 0h-2M6 20h12a2 2 0 002-2V9a2 2 0 00-2-2H6a2 2 0 00-2 2v9a2 2 0 002 2zM9 11h.01M15 11h.01M10 15h4" />
                </svg>
              </div>
              <div>
                <h3 className="font-extrabold text-xs tracking-wider uppercase">MartBuddy</h3>
                <span className="text-[9px] text-blue-100 font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping" />
                  AI Tech Assistant
                </span>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="text-white/80 hover:text-white transition cursor-pointer"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Messages Body */}
          <div className="flex-grow p-4 overflow-y-auto space-y-4 bg-slate-955 border-b border-slate-800 shadow-inner custom-scrollbar">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div 
                  className={`max-w-[80%] p-3.5 rounded-2xl text-xs font-semibold
                    ${msg.sender === 'user' 
                      ? 'bg-blue-600 text-white rounded-br-none shadow-md' 
                      : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-bl-none shadow-sm'}`}
                >
                  <div dangerouslySetInnerHTML={{ __html: formatText(msg.text) }} />
                </div>
              </div>
            ))}
            
            {/* Loading Indicator */}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-slate-900 border border-slate-800 text-slate-450 p-3.5 rounded-2xl rounded-bl-none shadow-sm max-w-[80%] flex items-center gap-2">
                  <span className="text-[11px] font-bold text-slate-400">MartBuddy is thinking</span>
                  <span className="flex gap-1">
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </span>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Form Input */}
          <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-800 bg-slate-900 flex gap-2">
            <input 
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Ask MartBuddy to compare, search gadgets..."
              className="flex-grow bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-4 py-2.5 outline-none font-semibold text-slate-100 text-xs transition"
              disabled={isLoading}
            />
            <button 
              type="submit"
              disabled={isLoading}
              className="bg-gradient-to-r from-blue-600 to-purple-650 hover:from-blue-700 hover:to-purple-750 text-white p-2.5 rounded-xl transition duration-200 shadow cursor-pointer shrink-0 disabled:opacity-50"
            >
              <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </form>
        </div>
      )}
    </>
  );
};

export default MartBuddyChat;