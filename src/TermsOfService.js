import React from 'react';
import { useNavigate } from 'react-router-dom';

const TermsOfService = () => {
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
            Termos de Uso e Condições Gerais
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '16px' }}>
            Versão 1.0 • Data de Vigência: 31 de dezembro de 2025
          </p>
        </div>

        {/* Content */}
        <div style={{ color: '#e2e8f0', lineHeight: '1.8', fontSize: '15px' }}>
          <p style={{ marginBottom: '24px' }}>
            Bem-vindo à <strong style={{ color: '#a78bfa' }}>CinthiaMed</strong>. Leia atentamente estes Termos de Uso.
            Ao criar uma conta, acessar ou utilizar nossa aplicação, você ("Usuário") concorda em ficar vinculado a estes termos.
            Caso não concorde, você não deve utilizar o serviço.
          </p>

          <h2 style={{ color: '#a78bfa', fontSize: '24px', fontWeight: '600', marginTop: '32px', marginBottom: '16px' }}>
            1. DEFINIÇÕES E NATUREZA DO SERVIÇO
          </h2>
          <p><strong>1.1.</strong> A CinthiaMed é uma plataforma de Inteligência Artificial projetada exclusivamente como ferramenta de apoio à decisão clínica para médicos e profissionais de saúde.</p>
          <p><strong>1.2.</strong> O serviço oferece funcionalidades como calculadoras de doses pediátricas, estimativa de escores clínicos, transcrição de consultas e chat assistivo baseado em literatura médica.</p>
          <p><strong>1.3. Fonte de Informação:</strong> A I.A. da CinthiaMed utiliza como base de conhecimento diretrizes, bulários e literatura científica indexada em bases de dados públicas como a PubMed (National Library of Medicine). No entanto, a medicina é uma ciência dinâmica e a CinthiaMed não garante a atualização em tempo real de todas as condutas.</p>

          <h2 style={{ color: '#a78bfa', fontSize: '24px', fontWeight: '600', marginTop: '32px', marginBottom: '16px' }}>
            2. ELEGIBILIDADE E CADASTRO
          </h2>
          <p><strong>2.1.</strong> O uso da CinthiaMed é restrito a estudantes de medicina e profissionais de saúde habilitados.</p>
          <p><strong>2.2.</strong> O Usuário garante que todas as informações de cadastro (Nome, E-mail, Registro Profissional) são verdadeiras e atualizadas.</p>
          <p><strong>2.3.</strong> A senha de acesso é pessoal e intransferível. O Usuário é responsável por manter o sigilo de suas credenciais.</p>

          <h2 style={{ color: '#a78bfa', fontSize: '24px', fontWeight: '600', marginTop: '32px', marginBottom: '16px' }}>
            3. USO DAS FERRAMENTAS E LIMITAÇÃO DE RESPONSABILIDADE
          </h2>
          <p><strong>3.1. Caráter Auxiliar:</strong> A CinthiaMed <strong style={{ color: '#ef4444' }}>NÃO substitui</strong> o julgamento clínico, o diagnóstico médico ou a relação médico-paciente. O Usuário reconhece que a I.A. é uma ferramenta de meio, sujeita a erros, imprecisões ("alucinações") e limitações técnicas.</p>
          <p><strong>3.2. Cálculos de Doses e Pediatria:</strong> Ao utilizar a calculadora conversacional ou o módulo de doses pediátricas, o Usuário obriga-se a <strong style={{ color: '#fbbf24' }}>CONFERIR MANUALMENTE</strong> todos os resultados, volumes e concentrações antes da prescrição ou administração. A CinthiaMed e seus desenvolvedores não se responsabilizam por erros de medicação decorrentes da falta de conferência humana.</p>
          <p><strong>3.3. Isenção de Danos:</strong> Em nenhuma hipótese a CinthiaMed será responsável por danos diretos, indiretos, incidentais, punitivos ou consequenciais (incluindo erro médico) resultantes do uso ou da confiança nas informações fornecidas pela plataforma. A responsabilidade final pela conduta é inteiramente do Usuário.</p>

          <h2 style={{ color: '#a78bfa', fontSize: '24px', fontWeight: '600', marginTop: '32px', marginBottom: '16px' }}>
            4. OBRIGAÇÕES DO USUÁRIO
          </h2>
          <p><strong>4.1.</strong> O Usuário compromete-se a utilizar a plataforma de forma ética e legal.</p>
          <p><strong>4.2. Proibição de Dados Sensíveis:</strong> É estritamente proibido inserir no chat, nas gravações ou em qualquer campo de texto, dados que identifiquem diretamente pacientes reais (Nome Completo, CPF, RG, Endereço, Telefone), em conformidade com a LGPD e normas do CFM. O Usuário deve sempre utilizar dados anonimizados (ex: "Paciente, 4 anos, sexo M").</p>
          <p><strong>4.3.</strong> O Usuário não deve tentar realizar engenharia reversa, "hackear" ou comprometer a segurança da aplicação.</p>

          <h2 style={{ color: '#a78bfa', fontSize: '24px', fontWeight: '600', marginTop: '32px', marginBottom: '16px' }}>
            5. PROPRIEDADE INTELECTUAL
          </h2>
          <p><strong>5.1.</strong> Todo o conteúdo, design, código-fonte, logotipos e algoritmos da CinthiaMed são propriedade exclusiva dos desenvolvedores. O uso da plataforma não transfere qualquer direito de propriedade intelectual ao Usuário.</p>

          <h2 style={{ color: '#a78bfa', fontSize: '24px', fontWeight: '600', marginTop: '32px', marginBottom: '16px' }}>
            6. ALTERAÇÕES E RESCISÃO
          </h2>
          <p><strong>6.1.</strong> A CinthiaMed reserva-se o direito de modificar estes Termos a qualquer momento, notificando o Usuário na plataforma.</p>
          <p><strong>6.2.</strong> Podemos suspender ou encerrar o acesso do Usuário caso haja violação destes termos, sem aviso prévio.</p>

          <h2 style={{ color: '#a78bfa', fontSize: '24px', fontWeight: '600', marginTop: '32px', marginBottom: '16px' }}>
            7. LEI APLICÁVEL E FORO
          </h2>
          <p><strong>7.1.</strong> Estes Termos são regidos pelas leis da República Federativa do Brasil. Fica eleito o foro da comarca de domicílio do desenvolvedor para dirimir quaisquer litígios.</p>

          {/* Footer */}
          <div style={{
            marginTop: '48px',
            padding: '24px',
            background: 'rgba(139, 92, 246, 0.1)',
            borderRadius: '12px',
            border: '1px solid rgba(139, 92, 246, 0.2)'
          }}>
            <p style={{ color: '#a78bfa', fontWeight: '600', marginBottom: '8px' }}>
              Contato para Dúvidas
            </p>
            <p style={{ color: '#94a3b8' }}>
              Para questões relacionadas aos Termos de Uso, entre em contato: <a href="mailto:suporte@cinthiamed.com" style={{ color: '#a78bfa', textDecoration: 'none' }}>suporte@cinthiamed.com</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;
