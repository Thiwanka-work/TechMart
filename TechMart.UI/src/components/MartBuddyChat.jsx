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
  const robotRef = useRef(null);
  const idleTimerRef = useRef(null);

  const [eyeOffset, setEyeOffset] = useState({ x: 0, y: 0 });
  const [isBlinking, setIsBlinking] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isIdle, setIsIdle] = useState(false);
  const [isExcited, setIsExcited] = useState(false);
  const [showGreeting, setShowGreeting] = useState(false);

  useEffect(() => {
    // Show proactive greeting 5s after load
    const greetingTimer = setTimeout(() => {
      setShowGreeting(true);
      // Trigger excitement animation for attention
      window.dispatchEvent(new CustomEvent('martbuddy:excite'));
    }, 5000);

    // Auto hide the greeting after 15 seconds (10s visible)
    const hideGreetingTimer = setTimeout(() => {
      setShowGreeting(false);
    }, 15000);

    return () => {
      clearTimeout(greetingTimer);
      clearTimeout(hideGreetingTimer);
    };
  }, []);

  useEffect(() => {
    // Mouse tracking for robot eyes and idle detection
    const handleMouseMove = (e) => {
      setIsIdle(false);
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      idleTimerRef.current = setTimeout(() => setIsIdle(true), 4000); // 4 seconds idle

      if (!robotRef.current) return;
      const rect = robotRef.current.getBoundingClientRect();
      const robotX = rect.left + rect.width / 2;
      const robotY = rect.top + rect.height / 2;
      
      const dx = e.clientX - robotX;
      const dy = e.clientY - robotY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      const maxEyeMove = 3; 
      const moveX = (dx / distance) * Math.min(distance / 50, maxEyeMove);
      const moveY = (dy / distance) * Math.min(distance / 50, maxEyeMove);
      
      setEyeOffset({ x: moveX || 0, y: moveY || 0 });
    };

    window.addEventListener('mousemove', handleMouseMove);

    // Global excitement listener
    const handleExcite = () => {
      setIsExcited(true);
      setTimeout(() => setIsExcited(false), 3500); // Stay excited for 3.5s
    };
    window.addEventListener('martbuddy:excite', handleExcite);

    // Blinking logic
    const blinkInterval = setInterval(() => {
      setIsBlinking(true);
      setTimeout(() => setIsBlinking(false), 150);
    }, Math.random() * 3000 + 2000); // 2-5 seconds

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('martbuddy:excite', handleExcite);
      clearInterval(blinkInterval);
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, []);

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
      <div className="fixed bottom-6 right-6 z-50 group">
        <style>{`
          @keyframes floatHeart {
            0% { transform: translate(0, 0) scale(0.5) rotate(0deg); opacity: 0; }
            20% { transform: translate(-10px, -20px) scale(1.2) rotate(-15deg); opacity: 1; }
            100% { transform: translate(20px, -120px) scale(1) rotate(15deg); opacity: 0; }
          }
          @keyframes floatHeart2 {
            0% { transform: translate(0, 0) scale(0.5) rotate(0deg); opacity: 0; }
            20% { transform: translate(15px, -30px) scale(1.3) rotate(20deg); opacity: 1; }
            100% { transform: translate(-15px, -100px) scale(0.8) rotate(-10deg); opacity: 0; }
          }
        `}</style>
        
        {/* Proactive Greeting Bubble */}
        {showGreeting && !isOpen && (
          <div className="absolute bottom-24 right-0 w-48 bg-slate-800 text-white p-3 rounded-2xl rounded-br-sm shadow-xl border border-blue-500/50 animate-[bounce_2s_infinite] origin-bottom-right z-50">
            <div className="flex items-start gap-2">
              <span className="text-xl">👋</span>
              <p className="text-xs font-medium leading-relaxed">Hi! I'm MartBuddy.<br/>Need help finding the best device today?</p>
            </div>
            {/* Close button for tooltip */}
            <button 
              onClick={(e) => { e.stopPropagation(); setShowGreeting(false); }}
              className="absolute -top-2 -right-2 w-5 h-5 bg-slate-700 hover:bg-rose-500 transition-colors rounded-full flex items-center justify-center text-slate-300 hover:text-white border border-slate-600 shadow-md cursor-pointer"
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        )}

        {/* Floating Hearts emitted towards user */}
        {isExcited && (
          <div className="absolute -top-10 left-0 right-0 h-32 pointer-events-none z-50">
             {[
               { id: 1, delay: '0s', anim: 'floatHeart' },
               { id: 2, delay: '0.2s', anim: 'floatHeart2' },
               { id: 3, delay: '0.4s', anim: 'floatHeart' },
               { id: 4, delay: '0.6s', anim: 'floatHeart2' },
               { id: 5, delay: '0.8s', anim: 'floatHeart' },
             ].map((heart) => (
                <svg key={heart.id} 
                     className="absolute text-pink-500 w-8 h-8 drop-shadow-md" 
                     style={{ 
                       left: '30%', 
                       animation: `${heart.anim} 1.5s ease-out forwards`, 
                       animationDelay: heart.delay,
                       opacity: 0
                     }}
                     viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                </svg>
             ))}
          </div>
        )}

        {/* Outer glowing aura (blue like the image) */}
        <div 
          className={`absolute -inset-1 ${isExcited ? 'bg-pink-500' : 'bg-blue-500'} rounded-[34px] rounded-br-xl blur opacity-40 group-hover:opacity-70 transition duration-500 ${isIdle ? 'opacity-10' : ''} ${isExcited ? 'animate-pulse opacity-100 blur-md' : ''}`}
        ></div>
        
        <button
          ref={robotRef}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onClick={() => { setIsOpen(!isOpen); setShowGreeting(false); }}
          className={`relative w-20 h-20 bg-slate-900 rounded-[32px] rounded-br-lg flex items-center justify-center transition-all duration-300 cursor-pointer overflow-hidden border-[3px] shadow-2xl ${isExcited ? 'border-pink-500 scale-110 -translate-y-2' : 'border-blue-500 hover:scale-110 active:scale-95'}`}
          title="Chat with MartBuddy"
        >
          {/* Crisp 3D SVG Robot Face Replica */}
          <svg viewBox="0 0 100 100" className="w-full h-full relative z-10 scale-[1.15] translate-y-2">
            <defs>
              <linearGradient id="headGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="70%" stopColor="#e2e8f0" />
                <stop offset="100%" stopColor="#94a3b8" />
              </linearGradient>
              <linearGradient id="screenGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#1e293b" />
                <stop offset="100%" stopColor="#020617" />
              </linearGradient>
              <radialGradient id="bulbGrad" cx="30%" cy="30%" r="50%">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="40%" stopColor={isExcited ? "#f43f5e" : "#38bdf8"} />
                <stop offset="100%" stopColor={isExcited ? "#be123c" : "#0284c7"} />
              </radialGradient>
              <filter id="cyanGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="2" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <filter id="pinkGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Body */}
            <circle cx="50" cy="100" r="28" fill="url(#headGrad)" />
            <path d="M 30 82 Q 50 90 70 82 L 65 95 Q 50 105 35 95 Z" fill="#0f172a" opacity="0.3" /> 

            {/* Neck */}
            <rect x="42" y="70" width="16" height="8" rx="2" fill="#1e293b" />

            {/* Antenna */}
            <rect x="48.5" y="8" width="3" height="15" fill="#475569" />
            <circle cx="50" cy="8" r="4.5" fill="url(#bulbGrad)" filter="url(#cyanGlow)" />

            {/* Ears (Behind head) */}
            <rect x="14" y="38" width="14" height="26" rx="6" fill="url(#headGrad)" stroke="#94a3b8" strokeWidth="1" />
            <rect x="17" y="43" width="3" height="16" rx="1.5" fill={isExcited ? "#f43f5e" : "#38bdf8"} filter={isExcited ? "url(#pinkGlow)" : "url(#cyanGlow)"} style={{ transition: 'all 0.3s' }} />

            <rect x="72" y="38" width="14" height="26" rx="6" fill="url(#headGrad)" stroke="#94a3b8" strokeWidth="1" />
            <rect x="80" y="43" width="3" height="16" rx="1.5" fill={isExcited ? "#f43f5e" : "#38bdf8"} filter={isExcited ? "url(#pinkGlow)" : "url(#cyanGlow)"} style={{ transition: 'all 0.3s' }} />

            {/* Main Head */}
            <rect x="20" y="22" width="60" height="52" rx="26" fill="url(#headGrad)" />

            {/* Face Screen */}
            <rect x="25" y="32" width="50" height="34" rx="17" fill="url(#screenGrad)" stroke="#0f172a" strokeWidth="2" />
            
            {/* Screen Highlight (Glossy reflection) */}
            <path d="M 28 34 Q 50 32 72 34 Q 72 40 50 40 Q 28 40 28 34 Z" fill="#ffffff" opacity="0.1" />

            {/* Eyes Container (Animated tracking) */}
            <g style={{ transform: `translate(${isExcited ? 0 : eyeOffset.x * 1.5}px, ${isExcited ? -2 : eyeOffset.y * 1.5}px)`, transition: 'transform 0.3s' }}>
              {/* Left Eye */}
              {isExcited ? (
                <path d="M 34 50 Q 38 42 42 50 Q 38 46 34 50 Z" fill="#f43f5e" filter="url(#pinkGlow)" />
              ) : (
                <ellipse 
                  cx="38" cy="48" rx="4" ry="6.5" 
                  fill={isHovered ? "#34d399" : "#38bdf8"} 
                  filter="url(#cyanGlow)" 
                  style={{ transform: `scaleY(${isIdle || isBlinking ? 0.1 : 1})`, transformOrigin: '38px 48px', transition: 'all 0.15s' }} 
                />
              )}
              {/* Right Eye */}
              {isExcited ? (
                <path d="M 58 50 Q 62 42 66 50 Q 62 46 58 50 Z" fill="#f43f5e" filter="url(#pinkGlow)" />
              ) : (
                <ellipse 
                  cx="62" cy="48" rx="4" ry="6.5" 
                  fill={isHovered ? "#34d399" : "#38bdf8"} 
                  filter="url(#cyanGlow)" 
                  style={{ transform: `scaleY(${isIdle || isBlinking ? 0.1 : 1})`, transformOrigin: '62px 48px', transition: 'all 0.15s' }} 
                />
              )}
            </g>

            {/* Mouth (Animated) */}
            <path 
              d={isExcited ? "M 40 56 Q 50 66 60 56" : isHovered ? "M 42 58 Q 50 64 58 58" : isIdle ? "M 46 58 L 54 58" : "M 44 58 Q 50 61 56 58"} 
              fill="transparent" 
              stroke={isExcited ? "#f43f5e" : isHovered ? "#34d399" : isIdle ? "#64748b" : "#38bdf8"} 
              strokeWidth="2.5" 
              strokeLinecap="round" 
              filter={isIdle ? "" : isExcited ? "url(#pinkGlow)" : "url(#cyanGlow)"}
              style={{ transition: 'all 0.3s' }}
            />
          </svg>
        </button>

        {/* Zzz Animation for Idle */}
        {isIdle && !isOpen && (
          <div className="absolute -top-2 -right-2 text-xs font-black text-slate-400 pointer-events-none select-none">
            <span className="animate-bounce inline-block" style={{ animationDuration: '2s' }}>Z</span>
            <span className="animate-bounce inline-block text-[10px] ml-0.5" style={{ animationDuration: '2s', animationDelay: '0.2s' }}>z</span>
            <span className="animate-bounce inline-block text-[8px] ml-0.5" style={{ animationDuration: '2s', animationDelay: '0.4s' }}>z</span>
          </div>
        )}
      </div>

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