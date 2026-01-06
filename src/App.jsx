import React, { useState } from 'react';

const CinthiaMed = () => {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [selectedAssistant, setSelectedAssistant] = useState('Assistente Geral');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const menuItems = [
    { icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>, label: 'Nova conversa', action: 'new' },
    { icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/></svg>, label: 'Análise de Exames', action: 'exams' },
    { icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="8" r="4"/><path d="M6 20v-2a4 4 0 014-4h4a4 4 0 014 4v2"/><circle cx="12" cy="8" r="2"/></svg>, label: 'Doses Pediátricas', action: 'pediatric' },
    { icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>, label: 'Emergência e UTI', action: 'emergency' },
    { icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>, label: 'Escores Clínicos', action: 'scores' },
    { icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="4" y="2" width="16" height="20" rx="2"/><path d="M8 6h8M8 10h8M8 14h4"/></svg>, label: 'Calculadora Médica', action: 'calculator' },
  ];

  const quickActions = [
    { icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0016.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 002 8.5c0 2.3 1.5 4.05 3 5.5l7 7 7-7z"/></svg>, label: 'Posologia' },
    { icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>, label: 'Discutir Caso' },
    { icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>, label: 'Pesquisar CID' },
    { icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20M2 12h20"/></svg>, label: 'Cálculo de Dose' },
  ];

  const handleSendMessage = () => {
    if (inputValue.trim()) {
      setMessages([...messages, { type: 'user', content: inputValue }]);
      setInputValue('');
      setTimeout(() => {
        setMessages(prev => [...prev, { 
          type: 'assistant', 
          content: 'Olá! Sou a CinthiaMed, sua assistente médica com IA. Como posso ajudá-lo hoje? Posso auxiliar com análise de exames, cálculo de doses, discussão de casos clínicos e muito mais.' 
        }]);
      }, 1000);
    }
  };

  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      backgroundColor: '#0a0f1a',
      fontFamily: "'Outfit', 'SF Pro Display', -apple-system, sans-serif",
      color: '#e2e8f0',
      overflow: 'hidden',
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap');
        
        * {
          box-sizing: border-box;
        }
        
        ::-webkit-scrollbar {
          width: 6px;
        }
        
        ::-webkit-scrollbar-track {
          background: transparent;
        }
        
        ::-webkit-scrollbar-thumb {
          background: #334155;
          border-radius: 3px;
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.8; }
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        
        @keyframes glow {
          0%, 100% { box-shadow: 0 0 20px rgba(139, 92, 246, 0.3); }
          50% { box-shadow: 0 0 40px rgba(139, 92, 246, 0.6); }
        }
        
        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>

      {/* Sidebar */}
      <aside style={{
        width: sidebarCollapsed ? '70px' : '280px',
        backgroundColor: '#111827',
        borderRight: '1px solid #1e293b',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 0.3s ease',
        position: 'relative',
        zIndex: 10,
      }}>
        {/* Logo */}
        <div style={{
          padding: '24px 20px',
          borderBottom: '1px solid #1e293b',
          display: 'flex',
          alignItems: 'center',
          justifyContent: sidebarCollapsed ? 'center' : 'space-between',
        }}>
          {!sidebarCollapsed && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 50%, #f97316 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px',
                fontWeight: '700',
                color: 'white',
                boxShadow: '0 4px 15px rgba(139, 92, 246, 0.4)',
              }}>
                C
              </div>
              <span style={{
                fontSize: '22px',
                fontWeight: '600',
                background: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                letterSpacing: '-0.5px',
              }}>
                CinthiaMed
              </span>
            </div>
          )}
          {sidebarCollapsed && (
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 50%, #f97316 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px',
              fontWeight: '700',
              color: 'white',
              boxShadow: '0 4px 15px rgba(139, 92, 246, 0.4)',
            }}>
              C
            </div>
          )}
          {!sidebarCollapsed && (
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#64748b',
                cursor: 'pointer',
                padding: '8px',
                borderRadius: '8px',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2"/>
                <path d="M9 3v18"/>
              </svg>
            </button>
          )}
        </div>

        {/* Menu Items */}
        <nav style={{
          padding: '16px 12px',
          flex: 1,
          overflowY: 'auto',
        }}>
          {menuItems.map((item, index) => (
            <button
              key={index}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: sidebarCollapsed ? '14px' : '14px 16px',
                marginBottom: '6px',
                backgroundColor: index === 0 ? 'rgba(139, 92, 246, 0.15)' : 'transparent',
                border: index === 0 ? '1px solid rgba(139, 92, 246, 0.3)' : '1px solid transparent',
                borderRadius: '12px',
                color: index === 0 ? '#a78bfa' : '#94a3b8',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                fontSize: '14px',
                fontWeight: '500',
                justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
                fontFamily: "'Outfit', sans-serif",
              }}
              onMouseEnter={(e) => {
                if (index !== 0) {
                  e.currentTarget.style.backgroundColor = '#1e293b';
                  e.currentTarget.style.color = '#e2e8f0';
                }
              }}
              onMouseLeave={(e) => {
                if (index !== 0) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = '#94a3b8';
                }
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{item.icon}</span>
              {!sidebarCollapsed && <span>{item.label}</span>}
            </button>
          ))}
        </nav>

        {/* Favorites & Recent */}
        {!sidebarCollapsed && (
          <div style={{
            padding: '16px',
            borderTop: '1px solid #1e293b',
          }}>
            <div style={{ marginBottom: '16px' }}>
              <h4 style={{
                fontSize: '11px',
                fontWeight: '600',
                color: '#64748b',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                marginBottom: '8px',
              }}>Favoritos</h4>
              <p style={{ fontSize: '13px', color: '#475569', margin: 0 }}>Nenhuma conversa</p>
            </div>
            <div>
              <h4 style={{
                fontSize: '11px',
                fontWeight: '600',
                color: '#64748b',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                marginBottom: '8px',
              }}>Recentes</h4>
              <p style={{ fontSize: '13px', color: '#475569', margin: 0 }}>Nenhuma conversa</p>
            </div>
            <button style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginTop: '12px',
              color: '#8b5cf6',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '13px',
              padding: '0',
              fontFamily: "'Outfit', sans-serif",
            }}>
              Ver todas as conversas 
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </button>
          </div>
        )}

        {/* User Profile */}
        <div style={{
          padding: '16px',
          borderTop: '1px solid #1e293b',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '16px',
            fontWeight: '600',
            color: 'white',
            flexShrink: 0,
          }}>
            M
          </div>
          {!sidebarCollapsed && (
            <>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: '14px', fontWeight: '500', margin: 0 }}>Dr. Médico</p>
                <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>Clínica Geral</p>
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" style={{ cursor: 'pointer' }}>
                <path d="M9 18l6-6-6-6"/>
              </svg>
            </>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Background Effect */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -60%)',
          width: '500px',
          height: '500px',
          background: 'radial-gradient(circle, rgba(139, 92, 246, 0.15) 0%, rgba(236, 72, 153, 0.08) 40%, transparent 70%)',
          borderRadius: '50%',
          filter: 'blur(60px)',
          pointerEvents: 'none',
          animation: 'pulse 4s ease-in-out infinite',
        }} />

        {/* Chat Area */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: messages.length === 0 ? 'center' : 'flex-start',
          padding: '40px 20px',
          overflowY: 'auto',
          position: 'relative',
          zIndex: 1,
        }}>
          {messages.length === 0 ? (
            <div style={{
              textAlign: 'center',
              maxWidth: '600px',
            }}>
              {/* Logo Animation */}
              <div style={{
                marginBottom: '40px',
                animation: 'float 3s ease-in-out infinite',
              }}>
                <div style={{
                  width: '140px',
                  height: '140px',
                  margin: '0 auto',
                  borderRadius: '35px',
                  background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.9) 0%, rgba(236, 72, 153, 0.9) 50%, rgba(249, 115, 22, 0.9) 100%)',
                  backgroundSize: '200% 200%',
                  animation: 'gradientShift 3s ease infinite, glow 2s ease-in-out infinite',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 20px 60px rgba(139, 92, 246, 0.4)',
                }}>
                  <span style={{
                    fontSize: '20px',
                    fontWeight: '600',
                    color: 'white',
                    fontFamily: "'Outfit', sans-serif",
                    letterSpacing: '-0.5px',
                  }}>
                    CinthiaMed
                  </span>
                </div>
              </div>

              <h1 style={{
                fontSize: '28px',
                fontWeight: '300',
                color: '#e2e8f0',
                marginBottom: '12px',
                letterSpacing: '-0.5px',
              }}>
                Sua assistente médica com <span style={{
                  background: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  fontWeight: '600',
                }}>Inteligência Artificial</span>
              </h1>
              <p style={{
                fontSize: '16px',
                color: '#64748b',
                marginBottom: '50px',
              }}>
                Análise de exames, cálculo de doses, discussão de casos e muito mais.
              </p>
            </div>
          ) : (
            <div style={{
              width: '100%',
              maxWidth: '800px',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
            }}>
              {messages.map((msg, index) => (
                <div
                  key={index}
                  style={{
                    display: 'flex',
                    justifyContent: msg.type === 'user' ? 'flex-end' : 'flex-start',
                  }}
                >
                  <div style={{
                    maxWidth: '80%',
                    padding: '16px 20px',
                    borderRadius: msg.type === 'user' ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
                    backgroundColor: msg.type === 'user' ? '#8b5cf6' : '#1e293b',
                    color: msg.type === 'user' ? 'white' : '#e2e8f0',
                    fontSize: '15px',
                    lineHeight: '1.6',
                    boxShadow: msg.type === 'user' 
                      ? '0 4px 20px rgba(139, 92, 246, 0.3)'
                      : '0 4px 20px rgba(0, 0, 0, 0.2)',
                  }}>
                    {msg.content}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Input Area */}
        <div style={{
          padding: '20px 40px 40px',
          position: 'relative',
          zIndex: 1,
        }}>
          <div style={{
            maxWidth: '800px',
            margin: '0 auto',
          }}>
            {/* Input Box */}
            <div style={{
              backgroundColor: '#1e293b',
              borderRadius: '20px',
              border: '1px solid #334155',
              padding: '16px 20px',
              marginBottom: '20px',
              boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
            }}>
              <input
                type="text"
                placeholder="Como posso lhe ajudar?"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                style={{
                  width: '100%',
                  backgroundColor: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: '#e2e8f0',
                  fontSize: '16px',
                  fontFamily: "'Outfit', sans-serif",
                }}
              />
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginTop: '16px',
                paddingTop: '12px',
                borderTop: '1px solid #334155',
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}>
                  <select
                    value={selectedAssistant}
                    onChange={(e) => setSelectedAssistant(e.target.value)}
                    style={{
                      backgroundColor: 'transparent',
                      border: 'none',
                      color: '#64748b',
                      fontSize: '14px',
                      cursor: 'pointer',
                      outline: 'none',
                      fontFamily: "'Outfit', sans-serif",
                    }}
                  >
                    <option value="Assistente Geral">Assistente Geral</option>
                    <option value="Análise de Exames">Análise de Exames</option>
                    <option value="Pediatria">Pediatria</option>
                    <option value="Emergência">Emergência</option>
                  </select>
                </div>
                <button
                  onClick={handleSendMessage}
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    background: inputValue.trim() 
                      ? 'linear-gradient(135deg, #8b5cf6, #ec4899)'
                      : '#334155',
                    border: 'none',
                    cursor: inputValue.trim() ? 'pointer' : 'default',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s',
                    boxShadow: inputValue.trim() 
                      ? '0 4px 15px rgba(139, 92, 246, 0.4)'
                      : 'none',
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                    <path d="M22 2L11 13M22 2L15 22L11 13L2 9L22 2Z" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Quick Actions */}
            <div style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'center',
              flexWrap: 'wrap',
            }}>
              {quickActions.map((action, index) => (
                <button
                  key={index}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '12px 20px',
                    backgroundColor: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '12px',
                    color: '#e2e8f0',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    fontSize: '14px',
                    fontWeight: '500',
                    fontFamily: "'Outfit', sans-serif",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#8b5cf6';
                    e.currentTarget.style.backgroundColor = 'rgba(139, 92, 246, 0.1)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#334155';
                    e.currentTarget.style.backgroundColor = '#1e293b';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <span style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    opacity: 0.9,
                  }}>
                    {action.icon}
                  </span>
                  {action.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CinthiaMed;
