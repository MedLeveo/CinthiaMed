# 🚀 Deploy Simples na VPS Hetzner (SEM DOMÍNIO)

## Deploy rápido usando apenas o IP da VPS

### 1️⃣ Conectar na VPS
```bash
ssh root@SEU_IP_HETZNER
```

### 2️⃣ Instalar Node.js
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt install -y nodejs git
npm install -g pm2
```

### 3️⃣ Clonar projeto
```bash
cd /root
git clone https://github.com/MedLeveo/CinthiaMed.git
cd CinthiaMed/server
npm install
```

### 4️⃣ Criar arquivo .env
```bash
nano .env
```

Cole (ajuste as chaves):
```env
OPENAI_API_KEY=sua_chave_openai
DATABASE_URL=postgresql://postgres:KZx24fSgcwsTkNdWaGoK@db.yupuudqizbwbgdzpzwjl.supabase.co:5432/postgres
GOOGLE_CLIENT_ID=seu_google_client_id
GOOGLE_CLIENT_SECRET=seu_google_client_secret
GOOGLE_CALLBACK_URL=http://SEU_IP_HETZNER:5000/api/auth/google/callback
SESSION_SECRET=$(openssl rand -hex 32)
BREVO_API_KEY=sua_chave_brevo
PORT=5000
NODE_ENV=production
```

Salvar: `Ctrl+O`, `Enter`, `Ctrl+X`

### 5️⃣ Iniciar backend
```bash
cd /root/CinthiaMed
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup
```

### 6️⃣ Abrir porta no firewall
```bash
ufw allow 5000/tcp
ufw allow 22/tcp
ufw enable
```

### 7️⃣ Testar
```bash
curl http://localhost:5000/health
```

## 🌐 Acessar de fora

Seu backend estará em: `http://SEU_IP_HETZNER:5000`

Exemplo: `http://95.123.45.67:5000/health`

## 📱 Configurar Frontend

### Opção A: Frontend local (desenvolvimento)
No seu PC, edite `src/CinthiaMed.js` e outros arquivos que chamam o backend:

Procure por `http://localhost:5000` e substitua por `http://SEU_IP_HETZNER:5000`

### Opção B: Frontend na Vercel (produção)

1. Crie arquivo `.env.production` na raiz:
```env
VITE_API_URL=http://SEU_IP_HETZNER:5000
```

2. Atualize as chamadas da API para usar a variável de ambiente

3. Deploy na Vercel normalmente

## ⚠️ IMPORTANTE: Sem HTTPS

Como não tem domínio, não terá HTTPS. Isso significa:

- ❌ Não é seguro para produção real
- ❌ Google OAuth pode não funcionar (exige HTTPS)
- ❌ Navegadores vão mostrar "Não seguro"
- ✅ OK para testes e desenvolvimento

## 🎯 Próximo passo: Conseguir domínio gratuito

Recomendo usar **DuckDNS** (mais fácil):

1. Acesse https://www.duckdns.org/
2. Faça login com GitHub
3. Crie um subdomínio: `cinthiamed.duckdns.org`
4. Aponte para o IP da sua VPS
5. Instale SSL com Let's Encrypt

Quer que eu crie o guia completo com DuckDNS?
