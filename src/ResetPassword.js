import React, { useState } from 'react';
import API_URL from './config/api';

const ResetPassword = ({ token, onSuccess, onBack }) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validações
    if (password.length < 6) {
      setError('A senha deve ter no mínimo 6 caracteres');
      return;
    }

    if (password !== confirmPassword) {
      setError('As senhas não coincidem');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao redefinir senha');
      }

      setSuccess(true);
      setTimeout(() => {
        onSuccess();
      }, 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 50%, #1e1b4b 100%)',
      fontFamily: "'Outfit', sans-serif",
      padding: '20px',
    }}>
      <div style={{
        background: 'linear-gradient(145deg, #1a1f2e 0%, #16213e 100%)',
        borderRadius: '24px',
        padding: '48px',
        width: '100%',
        maxWidth: '480px',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
        border: '1px solid #2a3142',
      }}>
        {/* Logo */}
        <div style={{
          textAlign: 'center',
          marginBottom: '32px',
        }}>
          <div style={{
            width: '80px',
            height: '80px',
            margin: '0 auto 20px',
            background: success
              ? 'linear-gradient(135deg, #22c55e, #10b981)'
              : 'linear-gradient(135deg, #8b5cf6, #ec4899)',
            borderRadius: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '36px',
            boxShadow: success
              ? '0 10px 30px rgba(34, 197, 94, 0.3)'
              : '0 10px 30px rgba(139, 92, 246, 0.3)',
          }}>
            {success ? '✅' : '🔑'}
          </div>
          <h1 style={{
            color: '#e2e8f0',
            fontSize: '28px',
            fontWeight: '700',
            margin: '0 0 8px 0',
          }}>
            {success ? 'Senha Redefinida!' : 'Nova Senha'}
          </h1>
          <p style={{
            color: '#64748b',
            fontSize: '14px',
            margin: 0,
          }}>
            {success
              ? 'Você será redirecionado para o login'
              : 'Digite sua nova senha'}
          </p>
        </div>

        {success ? (
          <div style={{
            background: 'rgba(34, 197, 94, 0.1)',
            border: '1px solid rgba(34, 197, 94, 0.3)',
            borderRadius: '12px',
            padding: '20px',
            textAlign: 'center',
          }}>
            <p style={{
              color: '#22c55e',
              fontSize: '16px',
              fontWeight: '600',
              margin: '0 0 12px 0',
            }}>
              Senha redefinida com sucesso!
            </p>
            <p style={{
              color: '#94a3b8',
              fontSize: '14px',
              margin: 0,
            }}>
              Redirecionando para o login...
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {/* Password Input */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                color: '#e2e8f0',
                fontSize: '14px',
                fontWeight: '500',
                marginBottom: '8px',
              }}>
                Nova Senha
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Mínimo 6 caracteres"
                  disabled={loading}
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    background: '#0f172a',
                    border: '1px solid #2a3142',
                    borderRadius: '12px',
                    color: '#e2e8f0',
                    fontSize: '15px',
                    outline: 'none',
                    transition: 'all 0.3s ease',
                    boxSizing: 'border-box',
                    paddingRight: '45px',
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#8b5cf6'}
                  onBlur={(e) => e.target.style.borderColor = '#2a3142'}
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
                    color: '#64748b',
                    cursor: 'pointer',
                    fontSize: '18px',
                    padding: '4px',
                  }}
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
            </div>

            {/* Confirm Password Input */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{
                display: 'block',
                color: '#e2e8f0',
                fontSize: '14px',
                fontWeight: '500',
                marginBottom: '8px',
              }}>
                Confirmar Senha
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                placeholder="Digite a senha novamente"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  background: '#0f172a',
                  border: '1px solid #2a3142',
                  borderRadius: '12px',
                  color: '#e2e8f0',
                  fontSize: '15px',
                  outline: 'none',
                  transition: 'all 0.3s ease',
                  boxSizing: 'border-box',
                }}
                onFocus={(e) => e.target.style.borderColor = '#8b5cf6'}
                onBlur={(e) => e.target.style.borderColor = '#2a3142'}
              />
            </div>

            {/* Password Strength Indicator */}
            {password && (
              <div style={{ marginBottom: '20px' }}>
                <div style={{
                  display: 'flex',
                  gap: '4px',
                  marginBottom: '8px',
                }}>
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      style={{
                        flex: 1,
                        height: '4px',
                        borderRadius: '2px',
                        background: password.length >= i * 3
                          ? password.length >= 12
                            ? '#22c55e'
                            : password.length >= 8
                            ? '#eab308'
                            : '#ef4444'
                          : '#2a3142',
                        transition: 'all 0.3s ease',
                      }}
                    />
                  ))}
                </div>
                <p style={{
                  color: password.length >= 12
                    ? '#22c55e'
                    : password.length >= 8
                    ? '#eab308'
                    : '#ef4444',
                  fontSize: '12px',
                  margin: 0,
                }}>
                  {password.length >= 12
                    ? '✓ Senha forte'
                    : password.length >= 8
                    ? '• Senha média'
                    : '• Senha fraca'}
                </p>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '12px',
                padding: '12px 16px',
                marginBottom: '24px',
              }}>
                <p style={{
                  color: '#ef4444',
                  fontSize: '14px',
                  margin: 0,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}>
                  <span>⚠️</span>
                  {error}
                </p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '16px',
                background: loading
                  ? '#64748b'
                  : 'linear-gradient(135deg, #8b5cf6, #ec4899)',
                color: '#fff',
                border: 'none',
                borderRadius: '12px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: loading
                  ? 'none'
                  : '0 4px 12px rgba(139, 92, 246, 0.4)',
                marginBottom: '16px',
              }}
              onMouseOver={(e) => {
                if (!loading) {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 6px 20px rgba(139, 92, 246, 0.6)';
                }
              }}
              onMouseOut={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 4px 12px rgba(139, 92, 246, 0.4)';
              }}
            >
              {loading ? 'Salvando...' : 'Redefinir senha'}
            </button>

            {/* Back Button */}
            <button
              type="button"
              onClick={onBack}
              style={{
                width: '100%',
                padding: '12px',
                background: 'transparent',
                color: '#8b5cf6',
                border: '1px solid #8b5cf6',
                borderRadius: '12px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
              }}
              onMouseOver={(e) => {
                e.target.style.background = 'rgba(139, 92, 246, 0.1)';
              }}
              onMouseOut={(e) => {
                e.target.style.background = 'transparent';
              }}
            >
              Cancelar
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;
