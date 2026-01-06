import React, { useState, useEffect } from 'react';

const LoginTransition = ({ userName, onComplete }) => {
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    // Iniciar fade out após 1 segundo (mais rápido)
    const timer = setTimeout(() => {
      setFadeOut(true);
    }, 1000);

    // Chamar onComplete após a animação completa (transição mais rápida)
    const completeTimer = setTimeout(() => {
      onComplete();
    }, 1800);

    return () => {
      clearTimeout(timer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 50%, #1e1b4b 100%)',
        zIndex: 9999,
        opacity: fadeOut ? 0 : 1,
        transition: 'opacity 1s ease-out',
        fontFamily: "'Outfit', sans-serif",
      }}
    >
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.8);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 0.4;
          }
          50% {
            opacity: 1;
          }
        }

        @keyframes expandCircle {
          from {
            width: 80px;
            height: 80px;
          }
          to {
            width: 100px;
            height: 100px;
          }
        }

        .welcome-icon {
          animation: scaleIn 0.6s ease-out;
        }

        .welcome-text {
          animation: fadeInUp 0.8s ease-out 0.3s both;
        }

        .welcome-subtext {
          animation: fadeInUp 0.8s ease-out 0.5s both;
        }

        .loading-dots {
          animation: pulse 1.5s ease-in-out infinite;
        }
      `}</style>

      {/* Ícone de boas-vindas */}
      <div
        className="welcome-icon"
        style={{
          width: '100px',
          height: '100px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          marginBottom: '30px',
          boxShadow: '0 10px 40px rgba(139, 92, 246, 0.4)',
        }}
      >
        <svg
          width="50"
          height="50"
          viewBox="0 0 24 24"
          fill="none"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
          <circle cx="12" cy="7" r="4"></circle>
        </svg>
      </div>

      {/* Texto de boas-vindas */}
      <h2
        className="welcome-text"
        style={{
          fontSize: '32px',
          fontWeight: '600',
          color: '#e2e8f0',
          margin: '0 0 12px 0',
          textAlign: 'center',
        }}
      >
        Bem-vindo, {userName}!
      </h2>

      {/* Subtexto */}
      <p
        className="welcome-subtext"
        style={{
          fontSize: '16px',
          color: '#94a3b8',
          margin: '0 0 30px 0',
          textAlign: 'center',
        }}
      >
        Preparando sua experiência
      </p>

      {/* Indicador de loading */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          alignItems: 'center',
        }}
      >
        <div
          className="loading-dots"
          style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: '#8b5cf6',
            animationDelay: '0s',
          }}
        />
        <div
          className="loading-dots"
          style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: '#8b5cf6',
            animationDelay: '0.2s',
          }}
        />
        <div
          className="loading-dots"
          style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: '#8b5cf6',
            animationDelay: '0.4s',
          }}
        />
      </div>
    </div>
  );
};

export default LoginTransition;
