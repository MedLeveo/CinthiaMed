import React, { useState, useEffect } from 'react';
import API_URL from './config/api';

const VerifyEmail = () => {
  const [status, setStatus] = useState('verifying'); // 'verifying', 'success', 'error', 'expired'
  const [message, setMessage] = useState('Verificando seu email...');
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const verifyEmail = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get('token');

      if (!token) {
        setStatus('error');
        setMessage('Token de verificação não encontrado na URL.');
        return;
      }

      try {
        const response = await fetch(`${API_URL}/api/auth/verify-email`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token }),
        });

        const data = await response.json();

        if (response.ok) {
          setStatus('success');
          setMessage(data.message || 'Email verificado com sucesso!');

          // Salvar token JWT e dados do usuário no localStorage
          if (data.token && data.user) {
            localStorage.setItem('authToken', data.token);
            localStorage.setItem('userName', data.user.name);
            localStorage.setItem('userEmail', data.user.email);
          }

          // Redirecionar para o app após 5 segundos
          let count = 5;
          const interval = setInterval(() => {
            count--;
            setCountdown(count);
            if (count === 0) {
              clearInterval(interval);
              window.location.href = '/';
            }
          }, 1000);
        } else {
          if (data.error && data.error.includes('expirado')) {
            setStatus('expired');
            setMessage(data.error);
          } else {
            setStatus('error');
            setMessage(data.error || 'Erro ao verificar email.');
          }
        }
      } catch (error) {
        console.error('Erro ao verificar email:', error);
        setStatus('error');
        setMessage('Erro de conexão. Tente novamente mais tarde.');
      }
    };

    verifyEmail();
  }, []);

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 50%, #1e1b4b 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "'Outfit', 'SF Pro Display', -apple-system, sans-serif",
      padding: '20px'
    }}>
      <div style={{
        maxWidth: '500px',
        width: '100%',
        background: 'linear-gradient(145deg, #1a1f2e 0%, #16213e 100%)',
        borderRadius: '24px',
        padding: '48px',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
        border: '1px solid #2a3142',
        textAlign: 'center'
      }}>
        {/* Logo */}
        <div style={{
          width: '80px',
          height: '80px',
          margin: '0 auto 24px',
          background: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
          borderRadius: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '40px',
          boxShadow: '0 10px 30px rgba(139, 92, 246, 0.3)'
        }}>
          {status === 'verifying' && '⏳'}
          {status === 'success' && '✅'}
          {status === 'error' && '❌'}
          {status === 'expired' && '⏰'}
        </div>

        {/* Título */}
        <h1 style={{
          color: '#e2e8f0',
          fontSize: '28px',
          fontWeight: '700',
          margin: '0 0 16px 0'
        }}>
          {status === 'verifying' && 'Verificando Email'}
          {status === 'success' && 'Email Verificado!'}
          {status === 'error' && 'Erro na Verificação'}
          {status === 'expired' && 'Link Expirado'}
        </h1>

        {/* Mensagem */}
        <p style={{
          color: '#94a3b8',
          fontSize: '16px',
          lineHeight: '1.6',
          margin: '0 0 32px 0'
        }}>
          {message}
        </p>

        {/* Loading spinner (apenas quando está verificando) */}
        {status === 'verifying' && (
          <div style={{
            width: '50px',
            height: '50px',
            margin: '0 auto',
            border: '3px solid rgba(139, 92, 246, 0.3)',
            borderTopColor: '#8b5cf6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}></div>
        )}

        {/* Sucesso - Contagem regressiva */}
        {status === 'success' && (
          <div style={{
            background: 'rgba(139, 92, 246, 0.1)',
            border: '1px solid rgba(139, 92, 246, 0.3)',
            borderRadius: '12px',
            padding: '20px',
            marginTop: '24px'
          }}>
            <p style={{
              color: '#a78bfa',
              fontSize: '14px',
              margin: 0
            }}>
              Você será redirecionado para o app em <strong>{countdown}</strong> segundos...
            </p>
          </div>
        )}

        {/* Erro - Botão para voltar */}
        {(status === 'error' || status === 'expired') && (
          <button
            onClick={() => window.location.href = '/'}
            style={{
              width: '100%',
              padding: '16px 32px',
              background: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '12px',
              fontWeight: '600',
              fontSize: '16px',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(139, 92, 246, 0.4)',
              transition: 'all 0.3s ease',
              marginTop: '24px'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 6px 16px rgba(139, 92, 246, 0.5)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 4px 12px rgba(139, 92, 246, 0.4)';
            }}
          >
            Voltar para o Login
          </button>
        )}

        {/* Footer */}
        <div style={{
          color: '#64748b',
          fontSize: '12px',
          marginTop: '32px',
          paddingTop: '24px',
          borderTop: '1px solid #2a3142'
        }}>
          <p style={{ margin: '0 0 8px 0' }}>CinthiaMed - Sua Assistente Médica com IA</p>
          <p style={{ margin: 0 }}>Dúvidas? Entre em contato: suporte@cinthiamed.com</p>
        </div>
      </div>

      {/* Animação de spin */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default VerifyEmail;
