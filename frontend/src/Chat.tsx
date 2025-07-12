import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, ChatResponse, sendChatMessage } from "./api";
import './Dashboard.css';
import Executor from "./Executor";

export default function Chat() {
  const [query, setQuery] = useState("");
  const [response, setResponse] = useState<ChatResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Array<{type: 'user' | 'bot', content: string}>>([]);
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setMessages(prev => [...prev, {type: 'user', content: query}]);

    try {
      const chatResponse = await sendChatMessage(query);
      setResponse(chatResponse);
      setMessages(prev => [...prev, {type: 'bot', content: chatResponse.message}]);

      // Handle navigation
      if (chatResponse.action_type === 'navigate' && chatResponse.route) {
        setTimeout(() => {
          navigate(chatResponse.route!);
        }, 1000);
      }

      // Handle API calls
      if (chatResponse.action_type === 'create' && chatResponse.api_call) {
        try {
          const apiResponse = await api.request({
            method: chatResponse.api_call.method,
            url: chatResponse.api_call.endpoint,
            data: chatResponse.api_call.data
          });
          
          setMessages(prev => [...prev, {
            type: 'bot', 
            content: `✅ Successfully created! Redirecting to view the updated list...`
          }]);

          // Navigate to the appropriate page after creation
          if (chatResponse.target_page) {
            setTimeout(() => {
              navigate(`/${chatResponse.target_page}`);
            }, 1500);
          }
        } catch (apiError) {
          setMessages(prev => [...prev, {
            type: 'bot', 
            content: `❌ Sorry, there was an error creating the resource. Please try again.`
          }]);
        }
      }

    } catch (error) {
      setMessages(prev => [...prev, {
        type: 'bot', 
        content: "Sorry, I encountered an error. Please try again."
      }]);
    } finally {
      setLoading(false);
      setQuery("");
    }
  };

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  return (
    <>
      {/* Chat Toggle Button */}
      <button
        onClick={toggleChat}
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          border: 'none',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          fontSize: '24px',
          cursor: 'pointer',
          boxShadow: '0 4px 20px rgba(102, 126, 234, 0.4)',
          zIndex: 1001,
          transition: 'all 0.3s ease',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
        title={isOpen ? 'Close Chat' : 'Open Chat'}
      >
        {isOpen ? '✕' : '💬'}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div style={{
          position: 'fixed',
          bottom: '90px',
          right: '20px',
          width: '400px',
          maxHeight: '500px',
          background: 'white',
          borderRadius: '12px',
          boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
          overflow: 'hidden',
          zIndex: 1000,
          animation: 'slideInUp 0.3s ease-out'
        }}>
          {/* Chat Header */}
          <div style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            padding: '15px',
            fontWeight: '600',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span>🤖 Dashboard Assistant</span>
            <button
              onClick={toggleChat}
              style={{
                background: 'none',
                border: 'none',
                color: 'white',
                fontSize: '16px',
                cursor: 'pointer',
                padding: '5px',
                borderRadius: '4px',
                opacity: 0.8
              }}
              title="Close Chat"
            >
              ✕
            </button>
          </div>

          {/* Messages */}
          <div style={{
            height: '300px',
            overflowY: 'auto',
            padding: '15px',
            background: '#f8f9fa'
          }}>
            {messages.length === 0 ? (
              <div style={{color: '#666', fontStyle: 'italic'}}>
                👋 Hi! I can help you navigate and manage your dashboard. Try saying:
                <br />• "show me users"
                <br />• "create user with name John and phone 123456"
                <br />• "go to roles page"
              </div>
            ) : (
              messages.map((msg, index) => (
                <div key={index} style={{
                  marginBottom: '10px',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  background: msg.type === 'user' ? '#667eea' : 'white',
                  color: msg.type === 'user' ? 'white' : '#333',
                  marginLeft: msg.type === 'user' ? '50px' : '0',
                  marginRight: msg.type === 'user' ? '0' : '50px',
                  boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
                }}>
                  {msg.content}
                </div>
              ))
            )}
            {loading && (
              <div style={{
                padding: '8px 12px',
                borderRadius: '8px',
                background: 'white',
                color: '#666',
                fontStyle: 'italic',
                marginRight: '50px'
              }}>
                🤔 Thinking...
              </div>
            )}
          </div>

          {/* Input Form */}
          <form onSubmit={handleSubmit} style={{
            padding: '15px',
            borderTop: '1px solid #eee',
            background: 'white'
          }}>
            <div style={{display: 'flex', gap: '10px'}}>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Type your message..."
                disabled={loading}
                style={{
                  flex: 1,
                  padding: '10px',
                  border: '2px solid #e1e1e1',
                  borderRadius: '8px',
                  fontSize: '14px'
                }}
              />
              <button 
                type="submit" 
                disabled={loading || !query.trim()}
                style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '8px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading || !query.trim() ? 0.6 : 1
                }}
              >
                Send
              </button>
            </div>
          </form>
          
          {response && <Executor action={response} />}
        </div>
      )}

      {/* CSS for animation */}
      <style>{`
        @keyframes slideInUp {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
      `}</style>
    </>
  );
}