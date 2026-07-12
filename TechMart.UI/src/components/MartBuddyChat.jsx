import React, { useState, useEffect, useRef } from 'react';
import api from '../api/axios';
import { usePendingFeedback } from '../hooks/usePendingFeedback';

const MartBuddyChat = () => {
  const INITIAL_MESSAGE = {
    sender: 'buddy',
    text: "Hello! I'm **MartBuddy**, your personal AI Shopping Assistant and Tech Consultant. 🤖\n\nHow can I help you find the absolute best device today? Feel free to ask me to compare devices in stock, suggest products matching your budget, or check features!"
  };

  const [isOpen, setIsOpen] = useState(false);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState([INITIAL_MESSAGE]);
  // Conversation history for memory: [{role:"user"|"model", text:"..."}]
  const [chatHistory, setChatHistory] = useState([]);

  // Pending feedback Hook & States
  const { pendingItems, hasPending, refreshPending } = usePendingFeedback();
  const [feedbackProduct, setFeedbackProduct] = useState(null);
  const [feedbackStep, setFeedbackStep] = useState(0); // 0 = none, 1 = rating, 2 = comment
  const [chatRating, setChatRating] = useState(0);
  const [showFeedbackBubble, setShowFeedbackBubble] = useState(false);
  const [feedbackBubbleItem, setFeedbackBubbleItem] = useState(null);

  const messagesEndRef = useRef(null);
  const robotRef = useRef(null);
  const idleTimerRef = useRef(null);
  const inputRef = useRef(null);

  const [eyeOffset, setEyeOffset] = useState({ x: 0, y: 0 });
  const [isBlinking, setIsBlinking] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isIdle, setIsIdle] = useState(false);
  const [isExcited, setIsExcited] = useState(false);
  const [showGreeting, setShowGreeting] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  useEffect(() => {
    const greetingTimer = setTimeout(() => {
      // Only show normal greeting if there are no pending reviews
      if (!hasPending) {
        setShowGreeting(true);
        window.dispatchEvent(new CustomEvent('martbuddy:excite'));
      }
    }, 5000);
    const hideGreetingTimer = setTimeout(() => {
      setShowGreeting(false);
    }, 15000);
    return () => {
      clearTimeout(greetingTimer);
      clearTimeout(hideGreetingTimer);
    };
  }, [hasPending]);

  useEffect(() => {
    if (!hasPending) {
      setShowFeedbackBubble(false);
      return;
    }
    if (hasPending && !isOpen) {
      const notified = sessionStorage.getItem('feedbackNotified');
      if (!notified) {
        const timer = setTimeout(() => {
          setFeedbackBubbleItem(pendingItems[0]);
          setShowFeedbackBubble(true);
          sessionStorage.setItem('feedbackNotified', 'true');
        }, 8000);
        return () => clearTimeout(timer);
      }
    }
  }, [hasPending, pendingItems, isOpen]);

  useEffect(() => {
    if (isOpen && hasPending && feedbackStep === 0) {
      const firstItem = pendingItems[0];
      setFeedbackProduct(firstItem);
      setFeedbackStep(1);
      
      setMessages(prev => [
        ...prev,
        {
          sender: 'buddy',
          text: `🎉 I noticed your order for **${firstItem.productName}** was marked as delivered! \n\nHow would you rate it from 1 to 5 stars? (Reply with a number: 1, 2, 3, 4, or 5)`
        }
      ]);
    }
  }, [isOpen, hasPending, pendingItems]);

  const startFeedbackFlow = (item) => {
    setFeedbackProduct(item);
    setFeedbackStep(1);
    setIsOpen(true);
    setShowFeedbackBubble(false);
    
    setMessages(prev => [
      ...prev,
      {
        sender: 'buddy',
        text: `🎉 I noticed your order for **${item.productName}** was marked as delivered! \n\nHow would you rate it from 1 to 5 stars? (Reply with a number: 1, 2, 3, 4, or 5)`
      }
    ]);
  };

  useEffect(() => {
    const handleReviewsUpdated = () => {
      refreshPending();
      setFeedbackProduct(null);
      setFeedbackStep(0);
      setChatRating(0);
    };
    window.addEventListener('reviews:updated', handleReviewsUpdated);
    return () => {
      window.removeEventListener('reviews:updated', handleReviewsUpdated);
    };
  }, [refreshPending]);

  useEffect(() => {
    const handleMouseMove = (e) => {
      setIsIdle(false);
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      idleTimerRef.current = setTimeout(() => setIsIdle(true), 4000);
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
    const handleExcite = () => {
      setIsExcited(true);
      setTimeout(() => setIsExcited(false), 3500);
    };
    window.addEventListener('martbuddy:excite', handleExcite);
    const blinkInterval = setInterval(() => {
      setIsBlinking(true);
      setTimeout(() => setIsBlinking(false), 150);
    }, Math.random() * 3000 + 2000);
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

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || isLoading) return;

    const userMsg = inputText.trim();
    setInputText('');
    setShowClearConfirm(false);

    // Add user message to display
    setMessages(prev => [...prev, { sender: 'user', text: userMsg }]);

    if (feedbackStep === 1) {
      const parsedRating = parseInt(userMsg);
      if (parsedRating >= 1 && parsedRating <= 5) {
        setChatRating(parsedRating);
        setFeedbackStep(2);
        setMessages(prev => [
          ...prev,
          {
            sender: 'buddy',
            text: `You rated it **${parsedRating} ⭐**. \n\nPlease tell me a little bit about why, or write your feedback comments here! (Or type "skip" to submit without comments)`
          }
        ]);
      } else {
        setMessages(prev => [
          ...prev,
          {
            sender: 'buddy',
            text: `Oops! Please enter a number from 1 to 5 stars to rate this product.`
          }
        ]);
      }
      return;
    }

    if (feedbackStep === 2) {
      setIsLoading(true);
      try {
        const commentText = userMsg.toLowerCase() === 'skip' ? '' : userMsg;
        await api.post('/chat/submit-feedback', {
          productId: feedbackProduct.productId,
          rating: chatRating,
          comment: commentText
        });
        
        setMessages(prev => [
          ...prev,
          {
            sender: 'buddy',
            text: `Thank you! Your feedback has been saved successfully. ✅\n\nIs there anything else I can help you with today?`
          }
        ]);
        
        setFeedbackProduct(null);
        setFeedbackStep(0);
        setChatRating(0);
        refreshPending();
      } catch (err) {
        console.error('Failed to submit chatbot feedback', err);
        setMessages(prev => [
          ...prev,
          {
            sender: 'buddy',
            text: `Sorry, I couldn't save your review due to a server error. Let's return to normal chat.`
          }
        ]);
        setFeedbackProduct(null);
        setFeedbackStep(0);
        setChatRating(0);
      } finally {
        setIsLoading(false);
      }
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.post('/chat', {
        message: userMsg,
        history: chatHistory
      });
      const botResponse = response.data?.response || "I couldn't fetch an answer right now. Please try again.";

      setMessages(prev => [...prev, { sender: 'buddy', text: botResponse }]);

      setChatHistory(prev => [
        ...prev,
        { role: 'user', text: userMsg },
        { role: 'model', text: botResponse }
      ]);
    } catch (err) {
      console.error('MartBuddy chat call failed.', err);
      const errorMsg = err.response?.data?.message || "Oops! I ran into an issue connecting to the servers. Please verify that the backend is active and the API Key is configured.";
      setMessages(prev => [...prev, { sender: 'buddy', text: `🤖 **Error:** ${errorMsg}` }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = () => {
    setMessages([INITIAL_MESSAGE]);
    setChatHistory([]);
    setShowClearConfirm(false);
  };

  // Format markdown-like text to readable HTML
  const formatText = (text) => {
    if (!text) return "";
    let formatted = text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/###\s+(.*)/g, '<h4 style="font-size:13px;font-weight:700;color:#e2e8f0;margin:10px 0 4px 0;">$1</h4>')
      .replace(/##\s+(.*)/g, '<h3 style="font-size:14px;font-weight:800;color:#ffffff;margin:12px 0 6px 0;text-transform:uppercase;letter-spacing:0.05em;">$1</h3>');

    return formatted.split('\n').map((line) => {
      let trimmed = line.trim();
      if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        return `<li style="margin-left:16px;list-style-type:disc;color:#cbd5e1;font-size:13px;margin-top:4px;line-height:1.6;">${trimmed.substring(2)}</li>`;
      }
      return trimmed
        ? `<p style="margin-bottom:6px;font-size:13px;line-height:1.7;color:inherit;">${line}</p>`
        : '<div style="height:4px;"></div>';
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
          @keyframes slideUp {
            from { opacity: 0; transform: translateY(16px) scale(0.97); }
            to   { opacity: 1; transform: translateY(0) scale(1); }
          }
          .chat-window { animation: slideUp 0.25s cubic-bezier(.4,0,.2,1) both; }
          .chat-scrollbar::-webkit-scrollbar { width: 5px; }
          .chat-scrollbar::-webkit-scrollbar-track { background: transparent; }
          .chat-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 99px; }
          .chat-scrollbar::-webkit-scrollbar-thumb:hover { background: #475569; }
          .memory-badge {
            display: inline-flex; align-items: center; gap: 4px;
            background: rgba(99,102,241,0.18); border: 1px solid rgba(99,102,241,0.35);
            color: #a5b4fc; font-size: 10px; font-weight: 700;
            padding: 2px 8px; border-radius: 99px; letter-spacing: 0.04em;
          }
        `}</style>

        {/* Proactive Greeting Bubble */}
        {showGreeting && !isOpen && (
          <div className="absolute bottom-24 right-0 w-52 bg-slate-800 text-white p-3.5 rounded-2xl rounded-br-sm shadow-xl border border-blue-500/50 animate-[bounce_2s_infinite] origin-bottom-right z-50">
            <div className="flex items-start gap-2">
              <span className="text-xl">👋</span>
              <p style={{ fontSize: '13px', fontWeight: 600, lineHeight: '1.5' }}>
                Hi! I'm MartBuddy.<br />Need help finding the best device today?
              </p>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); setShowGreeting(false); }}
              className="absolute -top-2 -right-2 w-5 h-5 bg-slate-700 hover:bg-rose-500 transition-colors rounded-full flex items-center justify-center text-slate-300 hover:text-white border border-slate-600 shadow-md cursor-pointer"
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* Proactive Feedback Speech Bubble */}
        {showFeedbackBubble && !isOpen && feedbackBubbleItem && (
          <div 
            onClick={() => startFeedbackFlow(feedbackBubbleItem)}
            className="absolute bottom-24 right-0 w-64 bg-slate-800 border border-amber-500/50 text-white p-3.5 rounded-2xl rounded-br-sm shadow-xl animate-[bounce_2s_infinite] origin-bottom-right z-50 cursor-pointer hover:border-amber-400 transition"
          >
            <div className="flex items-start gap-2">
              <span className="text-xl">📦</span>
              <div>
                <p style={{ fontSize: '12px', fontWeight: 700, lineHeight: '1.4' }}>
                  Your order for **{feedbackBubbleItem.productName}** has arrived!
                </p>
                <p className="text-[10px] text-amber-400 font-bold uppercase mt-1 flex items-center gap-1">
                  Tap to leave a review →
                </p>
              </div>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); setShowFeedbackBubble(false); }}
              className="absolute -top-2 -right-2 w-5 h-5 bg-slate-700 hover:bg-rose-500 transition-colors rounded-full flex items-center justify-center text-slate-300 hover:text-white border border-slate-600 shadow-md cursor-pointer"
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* Floating Hearts */}
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
                style={{ left: '30%', animation: `${heart.anim} 1.5s ease-out forwards`, animationDelay: heart.delay, opacity: 0 }}
                viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
            ))}
          </div>
        )}

        {/* Glow Aura */}
        <div className={`absolute -inset-1 ${isExcited ? 'bg-pink-500' : 'bg-blue-500'} rounded-[34px] rounded-br-xl blur opacity-40 group-hover:opacity-70 transition duration-500 ${isIdle ? 'opacity-10' : ''} ${isExcited ? 'animate-pulse opacity-100 blur-md' : ''}`} />

        {/* Proactive Feedback Notification Badge */}
        {hasPending && !isOpen && (
          <span className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white text-[10px] font-black w-6 h-6 rounded-full border border-slate-900 shadow-md z-30 animate-pulse flex items-center justify-center">
            {pendingItems.length}
          </span>
        )}

        {/* Robot Button */}
        <button
          ref={robotRef}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onClick={() => { setIsOpen(!isOpen); setShowGreeting(false); }}
          className={`relative w-20 h-20 bg-slate-900 rounded-[32px] rounded-br-lg flex items-center justify-center transition-all duration-300 cursor-pointer overflow-hidden border-[3px] shadow-2xl ${isExcited ? 'border-pink-500 scale-110 -translate-y-2' : 'border-blue-500 hover:scale-110 active:scale-95'}`}
          title="Chat with MartBuddy"
        >
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
                <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
              <filter id="pinkGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
            </defs>
            <circle cx="50" cy="100" r="28" fill="url(#headGrad)" />
            <path d="M 30 82 Q 50 90 70 82 L 65 95 Q 50 105 35 95 Z" fill="#0f172a" opacity="0.3" />
            <rect x="42" y="70" width="16" height="8" rx="2" fill="#1e293b" />
            <rect x="48.5" y="8" width="3" height="15" fill="#475569" />
            <circle cx="50" cy="8" r="4.5" fill="url(#bulbGrad)" filter="url(#cyanGlow)" />
            <rect x="14" y="38" width="14" height="26" rx="6" fill="url(#headGrad)" stroke="#94a3b8" strokeWidth="1" />
            <rect x="17" y="43" width="3" height="16" rx="1.5" fill={isExcited ? "#f43f5e" : "#38bdf8"} filter={isExcited ? "url(#pinkGlow)" : "url(#cyanGlow)"} style={{ transition: 'all 0.3s' }} />
            <rect x="72" y="38" width="14" height="26" rx="6" fill="url(#headGrad)" stroke="#94a3b8" strokeWidth="1" />
            <rect x="80" y="43" width="3" height="16" rx="1.5" fill={isExcited ? "#f43f5e" : "#38bdf8"} filter={isExcited ? "url(#pinkGlow)" : "url(#cyanGlow)"} style={{ transition: 'all 0.3s' }} />
            <rect x="20" y="22" width="60" height="52" rx="26" fill="url(#headGrad)" />
            <rect x="25" y="32" width="50" height="34" rx="17" fill="url(#screenGrad)" stroke="#0f172a" strokeWidth="2" />
            <path d="M 28 34 Q 50 32 72 34 Q 72 40 50 40 Q 28 40 28 34 Z" fill="#ffffff" opacity="0.1" />
            <g style={{ transform: `translate(${isExcited ? 0 : eyeOffset.x * 1.5}px, ${isExcited ? -2 : eyeOffset.y * 1.5}px)`, transition: 'transform 0.3s' }}>
              {isExcited ? (
                <path d="M 34 50 Q 38 42 42 50 Q 38 46 34 50 Z" fill="#f43f5e" filter="url(#pinkGlow)" />
              ) : (
                <ellipse cx="38" cy="48" rx="4" ry="6.5" fill={isHovered ? "#34d399" : "#38bdf8"} filter="url(#cyanGlow)"
                  style={{ transform: `scaleY(${isIdle || isBlinking ? 0.1 : 1})`, transformOrigin: '38px 48px', transition: 'all 0.15s' }} />
              )}
              {isExcited ? (
                <path d="M 58 50 Q 62 42 66 50 Q 62 46 58 50 Z" fill="#f43f5e" filter="url(#pinkGlow)" />
              ) : (
                <ellipse cx="62" cy="48" rx="4" ry="6.5" fill={isHovered ? "#34d399" : "#38bdf8"} filter="url(#cyanGlow)"
                  style={{ transform: `scaleY(${isIdle || isBlinking ? 0.1 : 1})`, transformOrigin: '62px 48px', transition: 'all 0.15s' }} />
              )}
            </g>
            <path
              d={isExcited ? "M 40 56 Q 50 66 60 56" : isHovered ? "M 42 58 Q 50 64 58 58" : isIdle ? "M 46 58 L 54 58" : "M 44 58 Q 50 61 56 58"}
              fill="transparent"
              stroke={isExcited ? "#f43f5e" : isHovered ? "#34d399" : isIdle ? "#64748b" : "#38bdf8"}
              strokeWidth="2.5" strokeLinecap="round"
              filter={isIdle ? "" : isExcited ? "url(#pinkGlow)" : "url(#cyanGlow)"}
              style={{ transition: 'all 0.3s' }}
            />
          </svg>
        </button>

        {/* Memory badge: shows how many turns remembered */}
        {chatHistory.length > 0 && !isOpen && (
          <div className="absolute -top-3 -left-3 pointer-events-none">
            <span className="memory-badge">
              <svg style={{ width: 10, height: 10 }} fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15v-4H7l5-8v4h4l-5 8z" />
              </svg>
              {chatHistory.length / 2} turns
            </span>
          </div>
        )}

        {/* Zzz Idle */}
        {isIdle && !isOpen && (
          <div className="absolute -top-2 -right-2 text-xs font-black text-slate-400 pointer-events-none select-none">
            <span className="animate-bounce inline-block" style={{ animationDuration: '2s' }}>Z</span>
            <span className="animate-bounce inline-block text-[10px] ml-0.5" style={{ animationDuration: '2s', animationDelay: '0.2s' }}>z</span>
            <span className="animate-bounce inline-block text-[8px] ml-0.5" style={{ animationDuration: '2s', animationDelay: '0.4s' }}>z</span>
          </div>
        )}
      </div>

      {/* ─── Chat Window ─── */}
      {isOpen && (
        <div
          className="chat-window fixed bottom-24 right-6 z-50 flex flex-col overflow-hidden"
          style={{
            width: 'calc(100vw - 32px)',
            maxWidth: '420px',
            height: 'min(540px, calc(100vh - 120px))',
            background: '#0f172a',
            border: '1px solid #1e293b',
            borderRadius: '20px',
            boxShadow: '0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(99,102,241,0.08)',
          }}
        >
          {/* Header */}
          <div style={{
            background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
            padding: '14px 16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexShrink: 0,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 38, height: 38, borderRadius: '50%',
                background: 'rgba(255,255,255,0.18)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg style={{ width: 20, height: 20, color: 'white' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m18 0h-2M6 20h12a2 2 0 002-2V9a2 2 0 00-2-2H6a2 2 0 00-2 2v9a2 2 0 002 2zM9 11h.01M15 11h.01M10 15h4" />
                </svg>
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: 14, color: 'white', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                  MartBuddy
                </div>
                <div style={{ fontSize: 11, color: 'rgba(219,234,254,0.9)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ width: 7, height: 7, background: '#34d399', borderRadius: '50%', display: 'inline-block', animation: 'ping 1s cubic-bezier(0,0,0.2,1) infinite' }} />
                  AI Tech Assistant
                  {chatHistory.length > 0 && (
                    <span className="memory-badge" style={{ marginLeft: 6 }}>
                      🧠 {chatHistory.length / 2} turns
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Header action buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {/* Clear chat button */}
              {messages.length > 1 && (
                <div style={{ position: 'relative' }}>
                  <button
                    onClick={() => setShowClearConfirm(v => !v)}
                    title="Clear conversation"
                    style={{
                      background: 'rgba(255,255,255,0.12)', border: 'none', borderRadius: 8,
                      width: 32, height: 32, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: 'rgba(255,255,255,0.8)', transition: 'all 0.15s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.35)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.12)'}
                  >
                    <svg style={{ width: 15, height: 15 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>

                  {/* Confirm popover */}
                  {showClearConfirm && (
                    <div style={{
                      position: 'absolute', top: '110%', right: 0,
                      background: '#1e293b', border: '1px solid #334155',
                      borderRadius: 12, padding: '12px 14px', width: 200,
                      zIndex: 100, boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                    }}>
                      <p style={{ fontSize: 12, color: '#e2e8f0', marginBottom: 10, fontWeight: 600, lineHeight: 1.5 }}>
                        Clear all messages and memory?
                      </p>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          onClick={handleClearChat}
                          style={{
                            flex: 1, background: '#ef4444', color: 'white',
                            border: 'none', borderRadius: 8, padding: '6px 0',
                            fontSize: 12, fontWeight: 700, cursor: 'pointer',
                          }}
                        >
                          Clear
                        </button>
                        <button
                          onClick={() => setShowClearConfirm(false)}
                          style={{
                            flex: 1, background: '#334155', color: '#94a3b8',
                            border: 'none', borderRadius: 8, padding: '6px 0',
                            fontSize: 12, fontWeight: 700, cursor: 'pointer',
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Close button */}
              <button
                onClick={() => { setIsOpen(false); setShowClearConfirm(false); }}
                style={{
                  background: 'rgba(255,255,255,0.12)', border: 'none', borderRadius: 8,
                  width: 32, height: 32, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'rgba(255,255,255,0.8)', transition: 'all 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.22)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.12)'}
              >
                <svg style={{ width: 15, height: 15 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Messages Body */}
          <div
            className="chat-scrollbar"
            style={{
              flexGrow: 1, overflowY: 'auto',
              padding: '16px', display: 'flex', flexDirection: 'column', gap: 12,
              background: '#0f172a',
            }}
          >
            {messages.map((msg, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start' }}>
                <div
                  style={{
                    maxWidth: '82%',
                    padding: '12px 15px',
                    borderRadius: msg.sender === 'user' ? '18px 18px 4px 18px' : '4px 18px 18px 18px',
                    background: msg.sender === 'user'
                      ? 'linear-gradient(135deg, #2563eb, #7c3aed)'
                      : '#1e293b',
                    border: msg.sender === 'user' ? 'none' : '1px solid #334155',
                    color: msg.sender === 'user' ? '#ffffff' : '#e2e8f0',
                    boxShadow: msg.sender === 'user'
                      ? '0 4px 16px rgba(37,99,235,0.3)'
                      : '0 2px 8px rgba(0,0,0,0.25)',
                    fontSize: 14,
                    lineHeight: 1.6,
                    fontWeight: 500,
                  }}
                >
                  <div dangerouslySetInnerHTML={{ __html: formatText(msg.text) }} />
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {isLoading && (
              <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <div style={{
                  background: '#1e293b', border: '1px solid #334155',
                  padding: '12px 16px', borderRadius: '4px 18px 18px 18px',
                  display: 'flex', alignItems: 'center', gap: 8,
                }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#94a3b8' }}>MartBuddy is thinking</span>
                  <span style={{ display: 'flex', gap: 4 }}>
                    {[0, 150, 300].map((delay, i) => (
                      <span key={i} style={{
                        width: 7, height: 7, background: '#6366f1',
                        borderRadius: '50%', display: 'inline-block',
                        animation: 'bounce 1s infinite',
                        animationDelay: `${delay}ms`,
                      }} />
                    ))}
                  </span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Form */}
          <form
            onSubmit={handleSendMessage}
            style={{
              padding: '12px 14px',
              borderTop: '1px solid #1e293b',
              background: '#0f172a',
              display: 'flex',
              gap: 10,
              alignItems: 'center',
              flexShrink: 0,
            }}
          >
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Ask MartBuddy anything..."
              disabled={isLoading}
              style={{
                flexGrow: 1,
                background: '#1e293b',
                border: '1.5px solid #334155',
                borderRadius: 12,
                padding: '11px 16px',
                outline: 'none',
                color: '#f1f5f9',
                fontSize: 14,
                fontWeight: 500,
                transition: 'border-color 0.2s',
                fontFamily: 'inherit',
              }}
              onFocus={e => e.target.style.borderColor = '#6366f1'}
              onBlur={e => e.target.style.borderColor = '#334155'}
            />
            <button
              type="submit"
              disabled={isLoading || !inputText.trim()}
              style={{
                background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
                border: 'none',
                borderRadius: 12,
                width: 44,
                height: 44,
                cursor: isLoading || !inputText.trim() ? 'not-allowed' : 'pointer',
                opacity: isLoading || !inputText.trim() ? 0.5 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                transition: 'all 0.2s',
                boxShadow: '0 4px 12px rgba(99,102,241,0.35)',
              }}
            >
              <svg style={{ width: 18, height: 18, color: 'white' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
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