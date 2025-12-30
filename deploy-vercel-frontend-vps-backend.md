# 🚀 Deploy: Frontend Vercel + Backend VPS Hetzner

## Arquitetura Final

- **Frontend:** https://cinthiamed.vercel.app (Vercel - gratuito)
- **Backend:** https://api-cinthiamed.duckdns.org (VPS Hetzner + DuckDNS - gratuito)
- **Banco de dados:** Supabase PostgreSQL (gratuito)

---

## 🎯 PARTE 1: Configurar Domínio Gratuito para o Backend

### Por que precisa de domínio/SSL?

- ❌ Frontend HTTPS + Backend HTTP = **BLOQUEADO pelo navegador**
- ✅ Frontend HTTPS + Backend HTTPS = **FUNCIONA**

### Opção A: DuckDNS (Recomendado - 5 minutos)

#### 1. Criar conta no DuckDNS
- Acesse: https://www.duckdns.org/
- Login com GitHub
- Crie um subdomínio: `api-cinthiamed`
- Resultado: `api-cinthiamed.duckdns.org`
- Cole o **IP da sua VPS Hetzner**

#### 2. Configurar na VPS

SSH na VPS:
```bash
ssh root@SEU_IP_VPS
```

Instalar NGINX e Certbot:
```bash
apt update
apt install -y nginx certbot python3-certbot-nginx
```

Criar configuração NGINX:
```bash
nano /etc/nginx/sites-available/cinthiamed
```

Cole:
```nginx
server {
    listen 80;
    server_name api-cinthiamed.duckdns.org;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # CORS headers
        add_header 'Access-Control-Allow-Origin' 'https://cinthiamed.vercel.app' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
        add_header 'Access-Control-Allow-Headers' 'Content-Type, Authorization' always;
        add_header 'Access-Control-Allow-Credentials' 'true' always;

        # Handle preflight
        if ($request_method = 'OPTIONS') {
            return 204;
        }
    }
}
```

Ativar site:
```bash
ln -s /etc/nginx/sites-available/cinthiamed /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```

Instalar SSL (HTTPS):
```bash
certbot --nginx -d api-cinthiamed.duckdns.org
```

Escolha opção 2 (redirecionar HTTP → HTTPS)

Configurar firewall:
```bash
ufw allow 'Nginx Full'
ufw allow 22/tcp
ufw enable
```

Testar:
```bash
curl https://api-cinthiamed.duckdns.org/health
```

Deve retornar: `{"status":"ok"...}`

---

## 🎯 PARTE 2: Configurar Backend na VPS

### 1. Instalar Node.js
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt install -y nodejs git
npm install -g pm2
```

### 2. Clonar projeto
```bash
cd /root
git clone https://github.com/MedLeveo/CinthiaMed.git
cd CinthiaMed/server
npm install
```

### 3. Configurar variáveis de ambiente
```bash
nano .env
```

Cole (ajuste as credenciais):
```env
# OpenAI
OPENAI_API_KEY=sua_chave_openai_aqui

# Database Supabase
DATABASE_URL=postgresql://postgres:SUA_SENHA@db.xxxxx.supabase.co:5432/postgres

# Google OAuth
GOOGLE_CLIENT_ID=seu_google_client_id
GOOGLE_CLIENT_SECRET=seu_google_client_secret
GOOGLE_CALLBACK_URL=https://api-cinthiamed.duckdns.org/api/auth/google/callback

# Session
SESSION_SECRET=gere_chave_aleatoria_aqui_min_32_caracteres

# Brevo
BREVO_API_KEY=sua_chave_smtp_brevo

# Server
PORT=5000
NODE_ENV=production
```

Salvar: `Ctrl+O`, `Enter`, `Ctrl+X`

### 4. Iniciar backend com PM2
```bash
cd /root/CinthiaMed
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup
```

Verificar:
```bash
pm2 status
pm2 logs cinthiamed-backend
```

---

## 🎯 PARTE 3: Atualizar Frontend para Produção

### 1. Criar arquivo de configuração de API

Crie: `src/config/api.js`

```javascript
// Detecta ambiente automaticamente
const API_URL = process.env.NODE_ENV === 'production'
  ? 'https://api-cinthiamed.duckdns.org'
  : 'http://localhost:5000';

export default API_URL;
```

### 2. Atualizar chamadas da API

Em **todos os arquivos** que fazem fetch para o backend, substitua:

**Antes:**
```javascript
fetch('http://localhost:5000/api/chat', ...)
```

**Depois:**
```javascript
import API_URL from './config/api';

fetch(`${API_URL}/api/chat`, ...)
```

Arquivos que precisam ser atualizados:
- `src/CinthiaMed.js`
- `src/Login.js`
- `src/ForgotPassword.js`
- `src/ResetPassword.js`

### 3. Adicionar CORS no backend

Edite `server/server.js`:

**Antes:**
```javascript
app.use(cors());
```

**Depois:**
```javascript
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? 'https://cinthiamed.vercel.app'
    : 'http://localhost:3000',
  credentials: true
}));
```

### 4. Commit e push
```bash
git add .
git commit -m "feat: configurar API para produção"
git push
```

---

## 🎯 PARTE 4: Deploy do Frontend na Vercel

### 1. Acessar Vercel
- Vá em: https://vercel.com/
- Login com GitHub
- Clique em **"New Project"**

### 2. Importar repositório
- Selecione: `MedLeveo/CinthiaMed`
- Framework Preset: **Vite**
- Root Directory: `./` (raiz)

### 3. Configurar variáveis de ambiente (se necessário)
Adicione no Vercel:
```
NODE_ENV=production
```

### 4. Deploy!
- Clique em **Deploy**
- Aguarde 2-3 minutos
- Seu frontend estará em: `https://cinthiamed.vercel.app`

### 5. Configurar domínio customizado (opcional)
Se você comprar um domínio depois:
- Vercel → Settings → Domains
- Adicione: `cinthiamed.com.br`

---

## 🎯 PARTE 5: Configurar Google OAuth

### Atualizar URIs autorizadas no Google Cloud Console

1. Acesse: https://console.cloud.google.com/
2. Vá em **APIs & Services** → **Credentials**
3. Clique na sua OAuth 2.0 Client ID
4. Em **Authorized redirect URIs**, adicione:
   - `https://api-cinthiamed.duckdns.org/api/auth/google/callback`
5. Em **Authorized JavaScript origins**, adicione:
   - `https://cinthiamed.vercel.app`
   - `https://api-cinthiamed.duckdns.org`

---

## ✅ CHECKLIST FINAL

### Backend (VPS Hetzner)
- [ ] DuckDNS configurado apontando para IP da VPS
- [ ] NGINX instalado e configurado
- [ ] SSL/HTTPS funcionando (Certbot)
- [ ] Node.js e PM2 instalados
- [ ] Projeto clonado e dependências instaladas
- [ ] .env configurado com todas as chaves
- [ ] PM2 rodando o backend
- [ ] Firewall configurado
- [ ] Teste: `curl https://api-cinthiamed.duckdns.org/health`

### Frontend (Vercel)
- [ ] Código atualizado para usar API de produção
- [ ] CORS configurado no backend
- [ ] Repositório atualizado no GitHub
- [ ] Deploy feito na Vercel
- [ ] Teste: Abrir `https://cinthiamed.vercel.app`

### Google OAuth
- [ ] URIs de callback atualizadas no Google Cloud Console

### Supabase (Banco)
- [ ] Já está funcionando (sem mudanças necessárias)

---

## 🧪 TESTAR APLICAÇÃO

### 1. Abrir frontend
https://cinthiamed.vercel.app

### 2. Criar conta de teste
- Usar email Gmail ou corporativo
- Senha forte

### 3. Fazer login

### 4. Testar funcionalidades
- [ ] Chat médico funciona
- [ ] Gravação de consulta funciona
- [ ] Calculadoras funcionam
- [ ] Login com Google funciona

---

## 🔧 COMANDOS ÚTEIS

### Ver logs do backend (na VPS)
```bash
pm2 logs cinthiamed-backend
```

### Reiniciar backend
```bash
pm2 restart cinthiamed-backend
```

### Atualizar código do backend
```bash
cd /root/CinthiaMed
git pull
cd server
npm install
pm2 restart cinthiamed-backend
```

### Ver status NGINX
```bash
systemctl status nginx
```

### Renovar SSL (automático, mas pode forçar)
```bash
certbot renew
```

---

## 💰 CUSTOS

- **Frontend (Vercel):** 🆓 GRÁTIS
- **Backend (VPS Hetzner):** 💶 O que você já paga pela VPS
- **Domínio (DuckDNS):** 🆓 GRÁTIS
- **SSL (Let's Encrypt):** 🆓 GRÁTIS
- **Banco (Supabase):** 🆓 GRÁTIS

**Total adicional: R$ 0,00** 🎉

---

## 🆘 TROUBLESHOOTING

### Erro: "Failed to fetch" no frontend
- Verificar se backend está rodando: `pm2 status`
- Verificar CORS no backend
- Abrir console do navegador (F12) e ver erro exato

### Erro: "SSL certificate problem"
```bash
certbot renew --force-renewal
```

### Erro: 502 Bad Gateway
```bash
# Verificar se backend está rodando
pm2 logs cinthiamed-backend

# Reiniciar NGINX
systemctl restart nginx
```

### Google OAuth não funciona
- Verificar URIs no Google Cloud Console
- Verificar GOOGLE_CALLBACK_URL no .env

---

## 🎯 PRÓXIMOS PASSOS (Opcional)

### Melhorias futuras:
1. Comprar domínio próprio (.com.br)
2. Configurar monitoramento (UptimeRobot)
3. Configurar backups automáticos do banco
4. Implementar CI/CD automático
5. Adicionar analytics (Google Analytics)

---

**Pronto! Sua aplicação estará 100% funcional e profissional!** 🚀
