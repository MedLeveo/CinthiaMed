import React, { useState } from 'react';
import API_URL from './config/api';

const ForgotPassword = ({ onBack }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao enviar email de recuperação');
      }

      setSuccess(true);
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
            background: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
            borderRadius: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '36px',
            boxShadow: '0 10px 30px rgba(139, 92, 246, 0.3)',
          }}>
            🔐
          </div>
          <h1 style={{
            color: '#e2e8f0',
            fontSize: '28px',
            fontWeight: '700',
            margin: '0 0 8px 0',
          }}>
            Recuperar Senha
          </h1>
          <p style={{
            color: '#64748b',
            fontSize: '14px',
            margin: 0,
          }}>
            {success
              ? 'Email enviado com sucesso!'
              : 'Digite seu email para receber as instruções'}
          </p>
        </div>

        {success ? (
          <div style={{
            background: 'rgba(34, 197, 94, 0.1)',
            border: '1px solid rgba(34, 197, 94, 0.3)',
            borderRadius: '12px',
            padding: '20px',
            marginBottom: '24px',
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '12px',
            }}>
              <span style={{ fontSize: '24px' }}>✅</span>
              <h3 style={{
                color: '#22c55e',
                fontSize: '16px',
                fontWeight: '600',
                margin: 0,
              }}>
                Email enviado!
              </h3>
            </div>
            <p style={{
              color: '#94a3b8',
              fontSize: '14px',
              lineHeight: '1.6',
              margin: 0,
            }}>
              Enviamos um link de recuperação para <strong style={{ color: '#e2e8f0' }}>{email}</strong>.
              Verifique sua caixa de entrada e spam.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {/* Email Input */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{
                display: 'block',
                color: '#e2e8f0',
                fontSize: '14px',
                fontWeight: '500',
                marginBottom: '8px',
              }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="seu@email.com"
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
              {loading ? 'Enviando...' : 'Enviar link de recuperação'}
            </button>
          </form>
        )}

        {/* Back to Login */}
        <button
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
          ← Voltar para o login
        </button>

        {/* Footer */}
        <div style={{
          marginTop: '32px',
          paddingTop: '24px',
          borderTop: '1px solid #2a3142',
          textAlign: 'center',
        }}>
          <p style={{
            color: '#64748b',
            fontSize: '13px',
            margin: 0,
          }}>
            O link de recuperação expira em <strong style={{ color: '#8b5cf6' }}>1 hora</strong>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
