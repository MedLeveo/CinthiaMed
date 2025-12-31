import React from 'react';
import { useNavigate } from 'react-router-dom';

const PrivacyPolicy = () => {
  const navigate = useNavigate();

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
      padding: '40px 20px',
      fontFamily: "'Outfit', sans-serif"
    }}>
      <div style={{
        maxWidth: '900px',
        margin: '0 auto',
        background: 'rgba(30, 41, 59, 0.6)',
        borderRadius: '24px',
        padding: '48px',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(139, 92, 246, 0.2)'
      }}>
        {/* Header */}
        <div style={{ marginBottom: '40px' }}>
          <button
            onClick={() => navigate('/')}
            style={{
              background: 'transparent',
              border: '1px solid rgba(139, 92, 246, 0.3)',
              color: '#a78bfa',
              padding: '10px 20px',
              borderRadius: '12px',
              cursor: 'pointer',
              fontSize: '14px',
              marginBottom: '24px',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(139, 92, 246, 0.1)';
              e.currentTarget.style.borderColor = '#a78bfa';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.3)';
            }}
          >
            ← Voltar
          </button>

          <h1 style={{
            fontSize: '36px',
            fontWeight: '700',
            background: 'linear-gradient(135deg, #a78bfa 0%, #ec4899 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: '8px'
          }}>
            Política de Privacidade e Proteção de Dados
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '16px' }}>
            Versão 1.0 • Data de Vigência: 31 de dezembro de 2025
          </p>
        </div>

        {/* Content */}
        <div style={{ color: '#e2e8f0', lineHeight: '1.8', fontSize: '15px' }}>
          <p style={{ marginBottom: '24px' }}>
            A <strong style={{ color: '#a78bfa' }}>CinthiaMed</strong> preza pela segurança e confidencialidade das informações.
            Esta Política de Privacidade descreve como coletamos, usamos e protegemos os seus dados, em conformidade com a
            Lei Geral de Proteção de Dados (Lei nº 13.709/2018 - LGPD).
          </p>

          <h2 style={{ color: '#a78bfa', fontSize: '24px', fontWeight: '600', marginTop: '32px', marginBottom: '16px' }}>
            1. DADOS QUE COLETAMOS
          </h2>
          <p style={{ marginBottom: '16px' }}>Coletamos o mínimo necessário para o funcionamento da aplicação:</p>
          <p><strong>1.1. Dados de Conta:</strong> Nome completo, endereço de e-mail e senha (armazenada de forma criptografada/hash).</p>
          <p><strong>1.2. Dados de Acesso:</strong> Logs de acesso, endereço IP, tipo de dispositivo e navegador, para fins de segurança e auditoria (prevenção contra ataques de força bruta).</p>
          <p><strong>1.3. Dados de Conteúdo:</strong> O texto das conversas e as transcrições de áudio geradas na utilização das ferramentas (ex: resumos de consulta).</p>

          <h2 style={{ color: '#a78bfa', fontSize: '24px', fontWeight: '600', marginTop: '32px', marginBottom: '16px' }}>
            2. DADOS SENSÍVEIS DE PACIENTES (IMPORTANTE)
          </h2>
          <p><strong>2.1. Política de Não-Coleta:</strong> A CinthiaMed <strong style={{ color: '#ef4444' }}>NÃO</strong> tem como finalidade armazenar Prontuários Eletrônicos identificáveis.</p>
          <p><strong>2.2. Responsabilidade do Usuário:</strong> O Usuário concorda em <strong style={{ color: '#fbbf24' }}>NÃO fornecer</strong> dados pessoais identificáveis de terceiros (pacientes) durante o uso da I.A. Caso o Usuário insira tais dados acidentalmente, ele reconhece que a CinthiaMed atua apenas como processadora transitória e não assume responsabilidade pela guarda legal desses prontuários.</p>

          <h2 style={{ color: '#a78bfa', fontSize: '24px', fontWeight: '600', marginTop: '32px', marginBottom: '16px' }}>
            3. COMO USAMOS SEUS DADOS
          </h2>
          <p><strong>3.1.</strong> Para autenticar sua identidade e permitir o acesso à conta.</p>
          <p><strong>3.2.</strong> Para processar as solicitações médicas (cálculos, resumos) através de nossas APIs de Inteligência Artificial.</p>
          <p><strong>3.3.</strong> Para melhorar a precisão dos modelos e corrigir bugs.</p>
          <p><strong>3.4.</strong> Para enviar comunicados importantes sobre segurança ou alterações nos termos.</p>

          <h2 style={{ color: '#a78bfa', fontSize: '24px', fontWeight: '600', marginTop: '32px', marginBottom: '16px' }}>
            4. COMPARTILHAMENTO DE DADOS
          </h2>
          <p style={{ marginBottom: '16px' }}>Não vendemos seus dados. Podemos compartilhar informações apenas nas seguintes situações:</p>
          <p><strong>4.1. Provedores de I.A.:</strong> O texto das consultas é processado por provedores de LLM (Large Language Models) parceiros, via conexão segura e criptografada, estritamente para gerar a resposta.</p>
          <p><strong>4.2. Hospedagem e Infraestrutura:</strong> Com serviços de nuvem e banco de dados que sustentam a aplicação.</p>
          <p><strong>4.3. Obrigação Legal:</strong> Mediante ordem judicial ou requisição de autoridades competentes.</p>

          <h2 style={{ color: '#a78bfa', fontSize: '24px', fontWeight: '600', marginTop: '32px', marginBottom: '16px' }}>
            5. SEGURANÇA DA INFORMAÇÃO
          </h2>
          <p><strong>5.1.</strong> Adotamos medidas técnicas robustas, incluindo criptografia SSL/TLS em trânsito e hashing de senhas em repouso.</p>
          <p><strong>5.2.</strong> Embora utilizemos as melhores práticas, nenhum sistema é 100% imune a ataques cibernéticos. O Usuário deve proteger sua senha e notificar a CinthiaMed imediatamente em caso de uso não autorizado.</p>

          <h2 style={{ color: '#a78bfa', fontSize: '24px', fontWeight: '600', marginTop: '32px', marginBottom: '16px' }}>
            6. SEUS DIREITOS (TITULAR DOS DADOS)
          </h2>
          <p style={{ marginBottom: '16px' }}>Conforme a LGPD, você tem direito a:</p>
          <p><strong>6.1.</strong> Confirmar a existência de tratamento de seus dados.</p>
          <p><strong>6.2.</strong> Solicitar a correção de dados incompletos ou desatualizados.</p>
          <p><strong>6.3.</strong> Solicitar a exclusão de sua conta e dos dados associados (exceto logs que devemos manter por lei).</p>

          <h2 style={{ color: '#a78bfa', fontSize: '24px', fontWeight: '600', marginTop: '32px', marginBottom: '16px' }}>
            7. CONTATO DO ENCARREGADO (DPO)
          </h2>
          <p>Para exercer seus direitos ou tirar dúvidas sobre privacidade, entre em contato através do canal de suporte da aplicação ou pelo e-mail: <a href="mailto:suporte@cinthiamed.com" style={{ color: '#a78bfa', textDecoration: 'none' }}>suporte@cinthiamed.com</a></p>

          {/* Footer */}
          <div style={{
            marginTop: '48px',
            padding: '24px',
            background: 'rgba(139, 92, 246, 0.1)',
            borderRadius: '12px',
            border: '1px solid rgba(139, 92, 246, 0.2)'
          }}>
            <p style={{ color: '#a78bfa', fontWeight: '600', marginBottom: '8px' }}>
              Proteção de Dados Pessoais
            </p>
            <p style={{ color: '#94a3b8' }}>
              A CinthiaMed está comprometida com a proteção dos seus dados pessoais conforme a LGPD (Lei nº 13.709/2018).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
