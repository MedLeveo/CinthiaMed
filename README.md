# 🩺 CinthiaMed

**Plataforma médica inteligente com IA integrada** para consultas médicas, geração de prontuários, calculadoras clínicas e acesso a estudos científicos.

## 🚀 Funcionalidades

### 🤖 Assistente Médico com IA
- Chat inteligente com GPT-4 especializado em medicina
- Consulta automática ao PubMed para embasamento científico
- Diferentes modos: Assistente Geral, Calculadora Conversacional, Pediatria

### 📋 Gravação de Consulta Online
- **Transcrição automática** de áudio com OpenAI Whisper
- **Geração inteligente de prontuários** no formato SOAP
- Identificação automática de pontos importantes
- Estruturação profissional: Subjetivo, Objetivo, Avaliação e Plano

### 🧮 Calculadoras Médicas
- **Calculadora Conversacional** - Pergunte e calcule naturalmente
- Calculadoras especializadas (IMC, QTc, Framingham, etc.)
- Escores clínicos (GRACE, CHA2DS2-VASc, HAS-BLED, etc.)

### 👶 Doses Pediátricas
- Cálculos específicos para pediatria
- Ajustes por peso e idade

### 🔬 Pesquisa Científica
- Integração com PubMed
- Busca automática de estudos relevantes
- Referências científicas em tempo real

### 🔐 Autenticação Segura
- Login com email e senha
- Autenticação com Google OAuth
- Recuperação de senha por email
- Sessões criptografadas com JWT

## 🛠️ Tecnologias Utilizadas

### Frontend
- **React 18** - Interface moderna e responsiva
- **CSS-in-JS** - Estilização componentizada
- **Fetch API** - Comunicação com backend

### Backend
- **Node.js + Express** - Servidor robusto
- **OpenAI API** - GPT-4 e Whisper para IA
- **PostgreSQL** - Banco de dados relacional
- **Passport.js** - Autenticação OAuth
- **Nodemailer + Brevo** - Envio de emails
- **Multer** - Upload de arquivos de áudio
- **bcrypt** - Hash de senhas
- **JWT** - Tokens de sessão

### Integrações
- **OpenAI GPT-4** - Respostas médicas inteligentes
- **OpenAI Whisper** - Transcrição de áudio
- **PubMed API** - Estudos científicos
- **Google OAuth** - Login social
- **Brevo (Sendinblue)** - Serviço de emails

## 📦 Instalação

### Pré-requisitos
- Node.js 16+ instalado
- PostgreSQL instalado (ou acesso a Supabase/Neon/Railway)
- Contas configuradas:
  - [OpenAI API](https://platform.openai.com/)
  - [Google Cloud Console](https://console.cloud.google.com/) (para OAuth)
  - [Brevo](https://www.brevo.com/) (para emails)

### 1. Clone o Repositório
```bash
git clone https://github.com/seu-usuario/cinthiamed.git
cd cinthiamed
```

### 2. Instalar Dependências

**Frontend:**
```bash
npm install
```

**Backend:**
```bash
cd server
npm install
```

### 3. Configurar Variáveis de Ambiente

Copie o arquivo `.env.example` e renomeie para `.env`:
```bash
cd server
cp .env.example .env
```

Edite o arquivo `.env` e preencha com suas credenciais:

```env
# OpenAI API
OPENAI_API_KEY=sua_chave_openai_aqui

# Banco de Dados
DATABASE_URL=postgresql://usuario:senha@host:porta/database

# Google OAuth
GOOGLE_CLIENT_ID=seu_client_id_aqui
GOOGLE_CLIENT_SECRET=seu_client_secret_aqui
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback

# Session
SESSION_SECRET=gere_uma_chave_aleatoria_segura

# Brevo (Emails)
BREVO_API_KEY=sua_smtp_key_aqui
```

### 4. Configurar Banco de Dados

O banco será inicializado automaticamente na primeira execução. Certifique-se de que o PostgreSQL está rodando e acessível.

### 5. Iniciar a Aplicação

**Backend** (porta 5000):
```bash
cd server
npm run dev
```

**Frontend** (porta 3000):
```bash
npm start
```

Acesse: `http://localhost:3000`

## 🔧 Configuração de APIs Externas

### OpenAI API
1. Acesse [platform.openai.com](https://platform.openai.com/)
2. Crie uma API Key
3. Adicione créditos à sua conta
4. Cole a chave no `.env`

### Google OAuth
1. Acesse [Google Cloud Console](https://console.cloud.google.com/)
2. Crie um novo projeto
3. Ative a API do Google+
4. Crie credenciais OAuth 2.0
5. Adicione `http://localhost:5000/api/auth/google/callback` nas URIs autorizadas
6. Cole Client ID e Client Secret no `.env`

### Brevo (Emails)
1. Crie conta em [brevo.com](https://www.brevo.com/)
2. Vá em Settings → SMTP & API → SMTP
3. Gere uma nova SMTP Key
4. Cole a chave no `.env`

### Banco de Dados (Supabase - Recomendado)
1. Crie conta em [supabase.com](https://supabase.com/)
2. Crie um novo projeto
3. Copie a URL de conexão PostgreSQL
4. Cole no `.env` como `DATABASE_URL`

## 📁 Estrutura do Projeto

```
cinthiamed/
├── public/                 # Arquivos estáticos
├── src/                    # Código fonte do frontend
│   ├── App.js             # Componente principal
│   ├── Login.js           # Autenticação
│   ├── CinthiaMed.js      # Dashboard principal
│   ├── LoginTransition.js # Transição de login
│   ├── ForgotPassword.js  # Recuperação de senha
│   └── ResetPassword.js   # Redefinição de senha
├── server/                 # Backend Node.js
│   ├── routes/            # Rotas da API
│   │   ├── auth.js        # Autenticação
│   │   └── medical-record.js  # Prontuários
│   ├── services/          # Serviços
│   │   └── emailService.js    # Envio de emails
│   ├── database/          # Configuração do BD
│   ├── config/            # Configurações
│   ├── openai-service.js  # Integração OpenAI
│   ├── server.js          # Servidor Express
│   └── .env.example       # Exemplo de variáveis
├── .gitignore             # Arquivos ignorados
├── package.json           # Dependências frontend
└── README.md              # Este arquivo
```

## 🚀 Deploy na Vercel

### Frontend
1. Faça push do código para o GitHub
2. Acesse [vercel.com](https://vercel.com/)
3. Importe o repositório
4. Configure as variáveis de ambiente
5. Deploy!

### Backend
Recomendamos hospedar o backend em:
- [Railway](https://railway.app/)
- [Render](https://render.com/)
- [Heroku](https://www.heroku.com/)

## 📝 API Endpoints

### Autenticação
- `POST /api/auth/register` - Cadastro
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/verify` - Verificar token
- `POST /api/auth/forgot-password` - Recuperar senha
- `POST /api/auth/reset-password` - Redefinir senha
- `GET /api/auth/google` - Login com Google

### Chat Médico
- `POST /api/chat` - Enviar mensagem para IA

### Prontuário Médico
- `POST /api/medical-record/transcribe` - Transcrever áudio
- `POST /api/medical-record/generate-record` - Gerar prontuário
- `POST /api/medical-record/process-consultation` - Processar consulta completa

### Análise
- `POST /api/analyze-consultation` - Analisar consulta
- `POST /api/analyze-exam-image` - Analisar imagem de exame

## 🔒 Segurança

- ✅ Senhas criptografadas com bcrypt
- ✅ Tokens JWT com expiração
- ✅ Validação de email (Gmail + corporativos)
- ✅ Senha forte obrigatória (6+ chars, maiúscula, número, especial)
- ✅ HTTPS obrigatório em produção
- ✅ Sanitização de inputs
- ✅ Rate limiting recomendado

## 🤝 Contribuindo

Contribuições são bem-vindas! Por favor:

1. Faça um Fork do projeto
2. Crie uma branch (`git checkout -b feature/MinhaFeature`)
3. Commit suas mudanças (`git commit -m 'Adiciona MinhaFeature'`)
4. Push para a branch (`git push origin feature/MinhaFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT.

## 👨‍💻 Autor

Desenvolvido com ❤️ para revolucionar o atendimento médico com IA.

## 📞 Suporte

Para dúvidas ou suporte, abra uma issue no GitHub.

---

**⚠️ Aviso Importante:** Este sistema utiliza IA e não substitui a avaliação médica profissional. Sempre consulte um médico qualificado para diagnóstico e tratamento.
