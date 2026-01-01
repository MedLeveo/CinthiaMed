import React, { useState, useEffect } from 'react';
import API_URL from './config/api';

const Login = ({ onLoginSuccess, onForgotPassword, onTermsClick, onPrivacyClick }) => {
  const [isLogin, setIsLogin] = useState(true); // true = login, false = cadastro
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState([]);

  // Check for Google OAuth callback
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const userStr = urlParams.get('user');
    const error = urlParams.get('error');

    if (error) {
      setError('Erro ao fazer login com Google');
      window.history.replaceState({}, document.title, window.location.pathname);
      return;
    }

    if (token && userStr) {
      try {
        const user = JSON.parse(decodeURIComponent(userStr));
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        window.history.replaceState({}, document.title, window.location.pathname);
        onLoginSuccess(user);
      } catch (err) {
        console.error('Error parsing OAuth response:', err);
        setError('Erro ao processar login');
      }
    }
  }, [onLoginSuccess]);

  // Validar email (aceita apenas Gmail ou emails corporativos)
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return 'Email inválido';
    }

    const domain = email.split('@')[1].toLowerCase();

    // Aceitar Gmail
    if (domain === 'gmail.com') {
      return null;
    }

    // Aceitar emails corporativos (domínios que não são provedores públicos conhecidos)
    const publicProviders = [
      'yahoo.com', 'yahoo.com.br', 'hotmail.com', 'outlook.com',
      'live.com', 'bol.com.br', 'uol.com.br', 'terra.com.br',
      'ig.com.br', 'globo.com', 'r7.com', 'aol.com', 'icloud.com'
    ];

    if (publicProviders.includes(domain)) {
      return 'Por favor, use um email do Gmail ou email corporativo';
    }

    // Email corporativo válido
    return null;
  };

  // Validar força da senha
  const validatePassword = (pwd) => {
    const errors = [];

    if (pwd.length < 6) {
      errors.push('Mínimo de 6 caracteres');
    }
    if (!/[A-Z]/.test(pwd)) {
      errors.push('Pelo menos uma letra maiúscula');
    }
    if (!/[0-9]/.test(pwd)) {
      errors.push('Pelo menos um número');
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(pwd)) {
      errors.push('Pelo menos um caractere especial (!@#$%^&*...)');
    }

    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setPasswordErrors([]);
    setLoading(true);

    try {
      // Validar email
      const emailError = validateEmail(email);
      if (emailError) {
        throw new Error(emailError);
      }

      // Validações específicas para cadastro
      if (!isLogin) {
        // Validar senha forte
        const pwdErrors = validatePassword(password);
        if (pwdErrors.length > 0) {
          setPasswordErrors(pwdErrors);
          throw new Error('A senha não atende aos requisitos de segurança');
        }

        // Validar confirmação de senha
        if (password !== confirmPassword) {
          throw new Error('As senhas não coincidem');
        }
      }

      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
      const body = isLogin
        ? { email, password }
        : { name, email, password };

      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao processar solicitação');
      }

      // Verificar se é cadastro que requer verificação de email
      if (!isLogin && data.requiresVerification) {
        // Mostrar mensagem de sucesso e instruções
        setError(''); // Limpar erros
        alert(`✅ ${data.message}\n\n📧 Um email de verificação foi enviado para ${data.email}.\n\nPor favor, verifique sua caixa de entrada e clique no link para ativar sua conta.`);
        // Mudar para tela de login
        setIsLogin(true);
        setEmail('');
        setPassword('');
        setConfirmPassword('');
        setName('');
        return;
      }

      // Login normal ou registro sem verificação (Google OAuth)
      // Salvar token no localStorage
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('userName', data.user.name);
      localStorage.setItem('userEmail', data.user.email);

      onLoginSuccess(data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    // Redirecionar para o endpoint do Google OAuth
    window.location.href = `${API_URL}/api/auth/google`;
  };

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 50%, #1e1b4b 100%)',
      fontFamily: "'Outfit', sans-serif",
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background decoration */}
      <div style={{
        position: 'absolute',
        top: '-50%',
        right: '-10%',
        width: '600px',
        height: '600px',
        background: 'radial-gradient(circle, rgba(139, 92, 246, 0.15) 0%, transparent 70%)',
        borderRadius: '50%',
        filter: 'blur(60px)',
      }} />
      <div style={{
        position: 'absolute',
        bottom: '-30%',
        left: '-10%',
        width: '500px',
        height: '500px',
        background: 'radial-gradient(circle, rgba(236, 72, 153, 0.15) 0%, transparent 70%)',
        borderRadius: '50%',
        filter: 'blur(60px)',
      }} />

      {/* Login Container */}
      <div style={{
        width: '100%',
        maxWidth: '460px',
        padding: '20px',
        position: 'relative',
        zIndex: 1,
      }}>
        {/* Logo */}
        <div style={{
          textAlign: 'center',
          marginBottom: '48px',
        }}>
          <h1 style={{
            fontSize: '48px',
            fontWeight: '700',
            background: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            margin: 0,
            letterSpacing: '2px',
          }}>
            CinthiaMed
          </h1>
        </div>

        {/* Login Card */}
        <div style={{
          backgroundColor: 'rgba(30, 41, 59, 0.8)',
          backdropFilter: 'blur(20px)',
          borderRadius: '24px',
          padding: '40px',
          border: '1px solid rgba(139, 92, 246, 0.2)',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.4)',
        }}>
          {/* Google Login Button */}
          <button
            onClick={handleGoogleLogin}
            style={{
              width: '100%',
              padding: '16px',
              backgroundColor: '#1a1f2e',
              border: '1px solid #2a3142',
              borderRadius: '12px',
              color: '#e2e8f0',
              fontSize: '15px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              transition: 'all 0.2s',
              fontFamily: "'Outfit', sans-serif",
              marginBottom: '24px',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#2a3142';
              e.currentTarget.style.borderColor = '#8b5cf6';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#1a1f2e';
              e.currentTarget.style.borderColor = '#2a3142';
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continuar com Google
          </button>

          {/* Divider */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            margin: '24px 0',
          }}>
            <div style={{ flex: 1, height: '1px', backgroundColor: '#2a3142' }} />
            <span style={{
              padding: '0 16px',
              color: '#64748b',
              fontSize: '14px',
              fontWeight: '500',
            }}>
              OU
            </span>
            <div style={{ flex: 1, height: '1px', backgroundColor: '#2a3142' }} />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            {!isLogin && (
              <div style={{ marginBottom: '20px' }}>
                <input
                  type="text"
                  placeholder="Digite seu nome"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required={!isLogin}
                  style={{
                    width: '100%',
                    padding: '16px',
                    backgroundColor: '#1a1f2e',
                    border: '1px solid #2a3142',
                    borderRadius: '12px',
                    color: '#e2e8f0',
                    fontSize: '15px',
                    fontFamily: "'Outfit', sans-serif",
                    outline: 'none',
                    boxSizing: 'border-box',
                    transition: 'all 0.2s',
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = '#8b5cf6'}
                  onBlur={(e) => e.currentTarget.style.borderColor = '#2a3142'}
                />
              </div>
            )}

            <div style={{ marginBottom: '20px' }}>
              <input
                type="email"
                placeholder="Digite seu e-mail"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '16px',
                  backgroundColor: '#1a1f2e',
                  border: '1px solid #2a3142',
                  borderRadius: '12px',
                  color: '#e2e8f0',
                  fontSize: '15px',
                  fontFamily: "'Outfit', sans-serif",
                  outline: 'none',
                  boxSizing: 'border-box',
                  transition: 'all 0.2s',
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = '#8b5cf6'}
                onBlur={(e) => e.currentTarget.style.borderColor = '#2a3142'}
              />
            </div>

            {/* Campo de Senha com toggle */}
            <div style={{ marginBottom: '24px', position: 'relative' }}>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Digite sua senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '16px',
                  paddingRight: '50px',
                  backgroundColor: '#1a1f2e',
                  border: '1px solid #2a3142',
                  borderRadius: '12px',
                  color: '#e2e8f0',
                  fontSize: '15px',
                  fontFamily: "'Outfit', sans-serif",
                  outline: 'none',
                  boxSizing: 'border-box',
                  transition: 'all 0.2s',
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = '#8b5cf6'}
                onBlur={(e) => e.currentTarget.style.borderColor = '#2a3142'}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: '#8b5cf6',
                  cursor: 'pointer',
                  fontSize: '18px',
                  padding: '4px 8px',
                }}
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>

            {/* Campo de Confirmação de Senha (apenas no cadastro) */}
            {!isLogin && (
              <div style={{ marginBottom: '24px', position: 'relative' }}>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirme sua senha"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '16px',
                    paddingRight: '50px',
                    backgroundColor: '#1a1f2e',
                    border: '1px solid #2a3142',
                    borderRadius: '12px',
                    color: '#e2e8f0',
                    fontSize: '15px',
                    fontFamily: "'Outfit', sans-serif",
                    outline: 'none',
                    boxSizing: 'border-box',
                    transition: 'all 0.2s',
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = '#8b5cf6'}
                  onBlur={(e) => e.currentTarget.style.borderColor = '#2a3142'}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: '#8b5cf6',
                    cursor: 'pointer',
                    fontSize: '18px',
                    padding: '4px 8px',
                  }}
                >
                  {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
            )}

            {/* Requisitos de senha (apenas no cadastro) */}
            {!isLogin && passwordErrors.length > 0 && (
              <div style={{
                padding: '12px',
                backgroundColor: 'rgba(251, 191, 36, 0.1)',
                border: '1px solid rgba(251, 191, 36, 0.3)',
                borderRadius: '8px',
                marginBottom: '16px',
              }}>
                <div style={{ color: '#fbbf24', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>
                  A senha deve conter:
                </div>
                {passwordErrors.map((err, idx) => (
                  <div key={idx} style={{ color: '#fbbf24', fontSize: '12px', marginBottom: '4px' }}>
                    • {err}
                  </div>
                ))}
              </div>
            )}

            {error && (
              <div style={{
                padding: '12px',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '8px',
                color: '#ef4444',
                fontSize: '14px',
                marginBottom: '20px',
              }}>
                {error}
              </div>
            )}

            {/* Login/Cadastro Links */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '24px',
              fontSize: '14px',
            }}>
              <span style={{ color: '#94a3b8' }}>
                {isLogin ? 'Não tem uma conta?' : 'Já tem uma conta?'}
                <button
                  type="button"
                  onClick={() => {
                    setIsLogin(!isLogin);
                    setError('');
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#8b5cf6',
                    cursor: 'pointer',
                    fontWeight: '600',
                    marginLeft: '6px',
                    fontFamily: "'Outfit', sans-serif",
                    fontSize: '14px',
                  }}
                >
                  {isLogin ? 'Cadastre-se' : 'Faça login'}
                </button>
              </span>

              {isLogin && (
                <button
                  type="button"
                  onClick={() => {
                    if (onForgotPassword) {
                      onForgotPassword();
                    }
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#8b5cf6',
                    cursor: 'pointer',
                    fontWeight: '600',
                    fontFamily: "'Outfit', sans-serif",
                    fontSize: '14px',
                  }}
                >
                  Esqueci minha senha
                </button>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '16px',
                background: loading ? '#64748b' : 'linear-gradient(135deg, #8b5cf6, #ec4899)',
                border: 'none',
                borderRadius: '12px',
                color: 'white',
                fontSize: '16px',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontFamily: "'Outfit', sans-serif",
                transition: 'all 0.2s',
                boxShadow: loading ? 'none' : '0 4px 20px rgba(139, 92, 246, 0.4)',
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 25px rgba(139, 92, 246, 0.5)';
                }
              }}
              onMouseLeave={(e) => {
                if (!loading) {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 20px rgba(139, 92, 246, 0.4)';
                }
              }}
            >
              {loading ? 'Processando...' : (isLogin ? 'Continuar com e-mail' : 'Criar conta')}
            </button>

            {/* Terms */}
            <p style={{
              marginTop: '20px',
              fontSize: '12px',
              color: '#64748b',
              textAlign: 'center',
              lineHeight: '1.5',
            }}>
              Ao criar sua conta, você concorda com nossos{' '}
              <span
                onClick={onTermsClick}
                style={{
                  color: '#8b5cf6',
                  cursor: 'pointer',
                  textDecoration: 'none',
                  fontWeight: '500'
                }}
                onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
                onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
              >
                Termos de Uso
              </span>
              {' '}e confirma que leu nossa{' '}
              <span
                onClick={onPrivacyClick}
                style={{
                  color: '#8b5cf6',
                  cursor: 'pointer',
                  textDecoration: 'none',
                  fontWeight: '500'
                }}
                onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
                onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
              >
                Política de Privacidade
              </span>
              .
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
