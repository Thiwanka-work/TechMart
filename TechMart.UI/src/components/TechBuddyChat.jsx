import React, { useState, useEffect, useRef } from 'react';
import api from '../api/axios';

const TechBuddyChat = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [products, setProducts] = useState([]);
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState([
    {
      sender: 'buddy',
      text: "Hello! I'm **TechBuddy**, your personal AI Shopping Assistant and Tech Consultant. 🤖\n\nHow can I help you find the absolute best device today? Feel free to ask me to compare devices, look for specific models, or filter by your budget!"
    }
  ]);

  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const fetchProducts = async () => {
    try {
      const response = await api.get('/products');
      setProducts(response.data || []);
    } catch (err) {
      console.error('TechBuddy failed to fetch products inventory context.', err);
    }
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const userMsg = inputText;
    setInputText('');

    // Append user message
    setMessages(prev => [...prev, { sender: 'user', text: userMsg }]);

    // Generate AI response
    setTimeout(() => {
      const responseText = parseQuery(userMsg);
      setMessages(prev => [...prev, { sender: 'buddy', text: responseText }]);
    }, 600);
  };

  const parseQuery = (msg) => {
    const query = msg.toLowerCase().trim();

    // Greets check
    const greetings = ['hi', 'hello', 'hey', 'greetings', 'yo', 'good morning', 'good afternoon'];
    if (greetings.some(g => query === g || query.startsWith(g + ' '))) {
      return "Hello! Greet client back warmly. How can I help you find your next tech device today?";
    }

    if (products.length === 0) {
      return "I'm currently updating my database context. Please try again in a few seconds!";
    }

    // Comparison parser (vs check)
    if (query.includes('vs') || query.includes('compare') || query.includes('difference between')) {
      return handleComparison(query);
    }

    // General search filter
    return handleSearch(query);
  };

  const handleComparison = (query) => {
    // Attempt to extract product names from comparison
    let parts = [];
    if (query.includes('vs')) {
      parts = query.split('vs');
    } else if (query.includes('compare')) {
      parts = query.replace('compare', '').split('and');
    }

    if (parts.length < 2) {
      return "To compare items, please type something like: *Compare iPhone 13 vs iPhone 14* or *Laptops vs Phone*.";
    }

    const term1 = parts[0].trim();
    const term2 = parts[1].trim();

    const prod1 = findClosestProduct(term1);
    const prod2 = findClosestProduct(term2);

    if (!prod1 && !prod2) {
      return `I couldn't find any products in our live inventory matching **"${term1}"** or **"${term2}"**. \n\nHere are some models currently in stock:\n${listInventoryBrief()}`;
    }

    if (!prod1) {
      return `I found **${prod2.name}** but couldn't find a match for **"${term1}"** in our inventory.\n\n**${prod2.name}** specifications:\n- Price: Rs. ${prod2.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}\n- Stock: ${prod2.stock > 0 ? `${prod2.stock} units available` : 'Out of Stock'}\n- Specs: ${prod2.description}`;
    }

    if (!prod2) {
      return `I found **${prod1.name}** but couldn't find a match for **"${term2}"** in our inventory.\n\n**${prod1.name}** specifications:\n- Price: Rs. ${prod1.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}\n- Stock: ${prod1.stock > 0 ? `${prod1.stock} units available` : 'Out of Stock'}\n- Specs: ${prod1.description}`;
    }

    // Both products exist
    return `### Tech Comparison: **${prod1.name}** vs **${prod2.name}**\n\n` +
           `💰 **Price comparison:**\n` +
           `- **${prod1.name}**: Rs. ${prod1.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}\n` +
           `- **${prod2.name}**: Rs. ${prod2.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}\n\n` +
           `📦 **Availability:**\n` +
           `- **${prod1.name}**: ${prod1.stock > 0 ? `In Stock (${prod1.stock} units)` : 'Out of Stock'}\n` +
           `- **${prod2.name}**: ${prod2.stock > 0 ? `In Stock (${prod2.stock} units)` : 'Out of Stock'}\n\n` +
           `📝 **Feature Specifications breakdown:**\n` +
           `- **${prod1.name}**: ${prod1.description}\n` +
           `- **${prod2.name}**: ${prod2.description}\n\n` +
           `💡 *Verdict:* Choose **${prod1.name}** if you prefer its specs, or **${prod2.name}** for alternative properties!`;
  };

  const findClosestProduct = (term) => {
    // Match exact name
    let matched = products.find(p => p.name.toLowerCase().includes(term));
    if (!matched) {
      // Check description
      matched = products.find(p => p.description.toLowerCase().includes(term));
    }
    return matched;
  };

  const handleSearch = (query) => {
    // Budget filter extraction
    const budgetMatch = query.match(/under\s+(\d+)|below\s+(\d+)|budget\s+(\d+)|max\s+(\d+)/);
    const maxBudget = budgetMatch ? parseInt(budgetMatch[1] || budgetMatch[2] || budgetMatch[3] || budgetMatch[4]) : null;

    // Filter categories
    let categoryKeywords = [];
    if (query.includes('laptop') || query.includes('macbook') || query.includes('computer')) categoryKeywords.push('laptop');
    if (query.includes('phone') || query.includes('mobile') || query.includes('iphone') || query.includes('samsung')) categoryKeywords.push('phone');
    if (query.includes('watch') || query.includes('band') || query.includes('smartwatch')) categoryKeywords.push('watch');
    if (query.includes('audio') || query.includes('earbud') || query.includes('headphone') || query.includes('pods')) categoryKeywords.push('audio');

    let matched = products;

    // Apply category filters
    if (categoryKeywords.length > 0) {
      matched = matched.filter(p => categoryKeywords.some(cat => p.category.toLowerCase().includes(cat) || p.name.toLowerCase().includes(cat)));
    }

    // Apply search query terms
    const ignoreWords = ['under', 'below', 'budget', 'max', 'find', 'show', 'search', 'want', 'buy', 'need', 'a', 'an', 'the', 'some', 'lkr', 'rs'];
    const searchTerms = query.split(/\s+/).filter(word => !ignoreWords.includes(word) && !word.match(/^\d+$/));

    if (searchTerms.length > 0) {
      matched = matched.filter(p => searchTerms.some(term => p.name.toLowerCase().includes(term) || p.description.toLowerCase().includes(term)));
    }

    // Apply budget filters
    if (maxBudget) {
      matched = matched.filter(p => p.price <= maxBudget);
    }

    if (matched.length === 0) {
      let failResponse = `I currently do not have those specifications in our live inventory. `;
      if (maxBudget) {
        failResponse += `Specifically, no devices under **Rs. ${maxBudget.toLocaleString()}** match that query. `;
      }
      return `${failResponse}\n\nHere are the closest items currently in stock in our warehouse:\n${listInventoryBrief()}`;
    }

    // Return list of matching products
    let response = `Here are the matching devices currently available in our live inventory:\n\n`;
    matched.slice(0, 3).forEach(p => {
      response += `📱 **${p.name}**\n`;
      response += `- **Price**: Rs. ${p.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}\n`;
      response += `- **Stock Status**: ${p.stock > 0 ? `In Stock (${p.stock} units)` : 'Out of Stock'}\n`;
      response += `- **Specs**: ${p.description}\n\n`;
    });

    return response;
  };

  const listInventoryBrief = () => {
    return products.slice(0, 3).map(p => 
      `- **${p.name}** (Rs. ${p.price.toLocaleString(undefined, { minimumFractionDigits: 2 })} - ${p.stock > 0 ? 'In Stock' : 'Out of Stock'})`
    ).join('\n');
  };

  const formatText = (text) => {
    // Simple markdown support
    return text.split('\n').map((line, idx) => {
      let formatted = line
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/###\s+(.*)/g, '<h4 class="text-xs font-bold text-slate-200 mt-2">$1</h4>');

      if (line.startsWith('- ')) {
        return `<li class="ml-4 list-disc text-slate-300 text-[11px] mt-0.5">${formatted.substring(2)}</li>`;
      }
      return `<p class="mb-1.5 leading-relaxed text-[11px]">${formatted}</p>`;
    }).join('');
  };

  return (
    <>
      {/* Floating Action Button (FAB) */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-gradient-to-r from-blue-600 to-purple-650 text-white rounded-full flex items-center justify-center shadow-xl hover:scale-105 active:scale-95 transition duration-200 cursor-pointer animate-float animate-glow"
        title="Chat with TechBuddy"
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
                <h3 className="font-extrabold text-xs tracking-wider uppercase">TechBuddy</h3>
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
          <div className="flex-grow p-4 overflow-y-auto space-y-4 bg-slate-950/60 custom-scrollbar">
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
            <div ref={messagesEndRef} />
          </div>

          {/* Form Input */}
          <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-800 bg-slate-900 flex gap-2">
            <input 
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Ask TechBuddy to compare, search gadgets..."
              className="flex-grow bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-4 py-2.5 outline-none font-semibold text-slate-100 text-xs transition"
            />
            <button 
              type="submit"
              className="bg-gradient-to-r from-blue-600 to-purple-650 hover:from-blue-700 hover:to-purple-750 text-white p-2.5 rounded-xl transition duration-200 shadow cursor-pointer shrink-0"
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

export default TechBuddyChat;