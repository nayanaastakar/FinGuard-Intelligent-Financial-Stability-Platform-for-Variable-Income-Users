import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles } from 'lucide-react';
import { generateSmartAIResponse } from '../utils/aiChatEngine';

export function AiCopilotChat({ dashboardData }) {
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'ai',
      text: 'Hello! I am your AI Financial Copilot. Ask me about your spending habits, category breakdowns, or savings targets!',
    }
  ]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg = { id: Date.now(), sender: 'user', text: input.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');

    // Simulate AI thinking delay
    setTimeout(() => {
      const aiMsg = {
        id: Date.now() + 1,
        sender: 'ai',
        text: generateSmartAIResponse(userMsg.text, dashboardData)
      };
      setMessages(prev => [...prev, aiMsg]);
    }, 800);
  };

  return (
    <div className="glass-panel glow-indigo" style={{ display: 'flex', flexDirection: 'column', height: '450px', padding: '0', marginTop: '2rem' }}>
      {/* Header */}
      <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid rgba(99, 102, 241, 0.15)', background: 'rgba(99, 102, 241, 0.05)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--color-primary), #6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
          <Sparkles size={16} />
        </div>
        <div>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>FinGuard Copilot</h3>
          <span style={{ fontSize: '0.7rem', color: 'var(--color-success)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--color-success)' }}></span> Online
          </span>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flexGrow: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {messages.map(msg => (
          <div key={msg.id} style={{ display: 'flex', gap: '0.75rem', alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start', maxWidth: '85%' }}>
            {msg.sender === 'ai' && (
              <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(99, 102, 241, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Bot size={14} style={{ color: '#6366f1' }} />
              </div>
            )}
            <div style={{
              background: msg.sender === 'user' ? 'var(--color-primary)' : 'var(--bg-secondary)',
              color: msg.sender === 'user' ? 'white' : 'var(--text-primary)',
              padding: '0.75rem 1rem',
              borderRadius: '12px',
              borderTopRightRadius: msg.sender === 'user' ? '0px' : '12px',
              borderTopLeftRadius: msg.sender === 'ai' ? '0px' : '12px',
              fontSize: '0.85rem',
              lineHeight: '1.4',
              boxShadow: '0 2px 5px rgba(0,0,0,0.05)'
            }}>
              {/* Simple markdown parsing for bold */}
              {msg.text.split('**').map((part, i) => i % 2 === 1 ? <strong key={i}>{part}</strong> : part)}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form onSubmit={handleSend} style={{ padding: '1rem', borderTop: '1px solid var(--border-color)', display: 'flex', gap: '0.5rem', background: 'var(--bg-tertiary)', borderBottomLeftRadius: '12px', borderBottomRightRadius: '12px' }}>
        <input 
          type="text" 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about your spending..."
          style={{ flexGrow: 1, padding: '0.75rem 1rem', borderRadius: '24px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', outline: 'none' }}
        />
        <button type="submit" disabled={!input.trim()} style={{ width: '40px', height: '40px', borderRadius: '50%', background: input.trim() ? 'var(--color-primary)' : 'var(--bg-secondary)', color: input.trim() ? 'white' : 'var(--text-muted)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: input.trim() ? 'pointer' : 'not-allowed', transition: 'all 0.2s' }}>
          <Send size={16} style={{ marginLeft: '2px' }} />
        </button>
      </form>
    </div>
  );
}
