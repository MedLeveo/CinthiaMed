import React, { useState, useEffect } from 'react';
import Login from './Login';
import CinthiaMed from './CinthiaMed';
import ForgotPassword from './ForgotPassword';
import ResetPassword from './ResetPassword';
import LoginTransition from './LoginTransition';
import TermsOfService from './TermsOfService';
import PrivacyPolicy from './PrivacyPolicy';
import VerifyEmail from './VerifyEmail';
import API_URL from './config/api';

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState('login'); // 'login', 'forgot-password', 'reset-password'
  const [showTransition, setShowTransition] = useState(false);

  // Verificar se há token salvo ao carregar
  useEffect(() => {
    const checkAuth = async () => {
      // Verificar se há erros nos parâmetros da URL
      const urlParams = new URLSearchParams(window.location.search);
      const errorFromUrl = urlParams.get('error');

      // Verificar se está na rota de reset de senha
      const pathname = window.location.pathname;
      const resetToken = urlParams.get('token');
      if (pathname === '/reset-password' && resetToken) {
        setCurrentView('reset-password');
        setLoading(false);
        return;
      }

      if (pathname === '/forgot-password') {
        setCurrentView('forgot-password');
        setLoading(false);
        return;
      }

      if (pathname === '/terms-of-service') {
        setCurrentView('terms-of-service');
        setLoading(false);
        return;
      }

      if (pathname === '/privacy-policy') {
        setCurrentView('privacy-policy');
        setLoading(false);
        return;
      }

      if (pathname === '/verify-email') {
        setCurrentView('verify-email');
        setLoading(false);
        return;
      }

      if (errorFromUrl) {
        console.error('Erro no login com Google:', errorFromUrl);
        alert('Erro ao fazer login com Google. Tente novamente.');
        window.history.replaceState({}, document.title, '/');
        setLoading(false);
        return;
      }

      // Google OAuth now sets localStorage directly via HTML page
      // No need to extract tokens from URL parameters (security improvement)

      const token = localStorage.getItem('authToken');
      const userName = localStorage.getItem('userName');
      const userEmail = localStorage.getItem('userEmail');

      if (token && userName && userEmail) {
        // Verificar se o token ainda é válido
        try {
          const response = await fetch(`${API_URL}/api/auth/verify`, {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });

          if (response.ok) {
            setUser({ name: userName, email: userEmail });
            setIsAuthenticated(true);
          } else {
            // Token inválido, limpar localStorage
            localStorage.removeItem('authToken');
            localStorage.removeItem('userName');
            localStorage.removeItem('userEmail');
          }
        } catch (error) {
          console.error('Erro ao verificar autenticação:', error);
        }
      }

      setLoading(false);
    };

    checkAuth();
  }, []);

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    setShowTransition(true);
  };

  const handleTransitionComplete = () => {
    setShowTransition(false);
    setIsAuthenticated(true);
  };

  const handleLogout = async () => {
    const token = localStorage.getItem('authToken');

    try {
      await fetch(`${API_URL}/api/auth/logout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }

    localStorage.removeItem('authToken');
    localStorage.removeItem('userName');
    localStorage.removeItem('userEmail');
    setUser(null);
    setIsAuthenticated(false);
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 50%, #1e1b4b 100%)',
      }}>
        <div style={{
          textAlign: 'center',
          color: '#e2e8f0',
          fontFamily: "'Outfit', sans-serif",
        }}>
          <div style={{
            width: '60px',
            height: '60px',
            border: '3px solid rgba(139, 92, 246, 0.3)',
            borderTopColor: '#8b5cf6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 20px',
          }} />
          <style>{`
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
          `}</style>
          <p>Carregando CinthiaMed...</p>
        </div>
      </div>
    );
  }

  // Mostrar transição se necessário
  if (showTransition) {
    return (
      <LoginTransition
        userName={user?.name || 'Usuário'}
        onComplete={handleTransitionComplete}
      />
    );
  }

  // Renderizar view apropriada
  const renderView = () => {
    if (isAuthenticated) {
      return (
        <div style={{
          animation: 'fadeIn 0.8s ease-out',
        }}>
          <style>{`
            @keyframes fadeIn {
              from {
                opacity: 0;
              }
              to {
                opacity: 1;
              }
            }
          `}</style>
          <CinthiaMed user={user} onLogout={handleLogout} />
        </div>
      );
    }

    switch (currentView) {
      case 'forgot-password':
        return (
          <ForgotPassword
            onBack={() => {
              setCurrentView('login');
              window.history.pushState({}, '', '/');
            }}
          />
        );

      case 'reset-password':
        const urlParams = new URLSearchParams(window.location.search);
        const resetToken = urlParams.get('token');
        return (
          <ResetPassword
            token={resetToken}
            onSuccess={() => {
              setCurrentView('login');
              window.history.pushState({}, '', '/');
            }}
            onBack={() => {
              setCurrentView('login');
              window.history.pushState({}, '', '/');
            }}
          />
        );

      case 'terms-of-service':
        return <TermsOfService />;

      case 'privacy-policy':
        return <PrivacyPolicy />;

      case 'verify-email':
        return <VerifyEmail />;

      default:
        return (
          <Login
            onLoginSuccess={handleLoginSuccess}
            onForgotPassword={() => {
              setCurrentView('forgot-password');
              window.history.pushState({}, '', '/forgot-password');
            }}
            onTermsClick={() => {
              setCurrentView('terms-of-service');
              window.history.pushState({}, '', '/terms-of-service');
            }}
            onPrivacyClick={() => {
              setCurrentView('privacy-policy');
              window.history.pushState({}, '', '/privacy-policy');
            }}
          />
        );
    }
  };

  return <>{renderView()}</>;
};

export default App;
