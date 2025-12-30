# 🚀 Deploy do CinthiaMed na VPS Hetzner

## Pré-requisitos

- VPS Hetzner com Ubuntu 20.04+ (ou Debian)
- Acesso SSH root ou sudo
- Domínio apontando para o IP da VPS (opcional, mas recomendado)

## 1️⃣ Preparar VPS

### Conectar via SSH
```bash
ssh root@seu-ip-hetzner
```

### Atualizar sistema
```bash
apt update && apt upgrade -y
```

### Instalar Node.js 18+
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt install -y nodejs
node --version  # Verificar instalação
npm --version
```

### Instalar PM2 (gerenciador de processos)
```bash
npm install -g pm2
```

### Instalar PostgreSQL (se não usar Supabase)
```bash
apt install -y postgresql postgresql-contrib
systemctl start postgresql
systemctl enable postgresql
```

## 2️⃣ Configurar Projeto

### Clonar repositório
```bash
cd /var/www
git clone https://github.com/MedLeveo/CinthiaMed.git
cd CinthiaMed
```

### Instalar dependências do backend
```bash
cd server
npm install --production
```

### Criar arquivo .env
```bash
nano .env
```

Cole as variáveis de ambiente:
```env
# OpenAI
OPENAI_API_KEY=sua_chave_aqui

# Database (Supabase ou local)
DATABASE_URL=postgresql://usuario:senha@localhost:5432/cinthiamed

# Google OAuth
GOOGLE_CLIENT_ID=seu_client_id
GOOGLE_CLIENT_SECRET=seu_client_secret
GOOGLE_CALLBACK_URL=https://seu-dominio.com/api/auth/google/callback

# Session
SESSION_SECRET=gere_uma_chave_aleatoria_segura_aqui

# Brevo
BREVO_API_KEY=sua_chave_smtp

# Porta
PORT=5000
```

Salvar: `Ctrl+O`, `Enter`, `Ctrl+X`

## 3️⃣ Configurar PostgreSQL Local (opcional)

### Criar usuário e banco
```bash
sudo -u postgres psql

CREATE DATABASE cinthiamed;
CREATE USER cinthia_user WITH ENCRYPTED PASSWORD 'senha_segura_aqui';
GRANT ALL PRIVILEGES ON DATABASE cinthiamed TO cinthia_user;
\q
```

### Atualizar .env com a connection string local
```env
DATABASE_URL=postgresql://cinthia_user:senha_segura_aqui@localhost:5432/cinthiamed
```

## 4️⃣ Iniciar Backend com PM2

### Voltar para raiz do projeto
```bash
cd /var/www/CinthiaMed
```

### Criar diretório de logs
```bash
mkdir -p logs
```

### Iniciar com PM2
```bash
pm2 start ecosystem.config.cjs
```

### Configurar PM2 para iniciar no boot
```bash
pm2 startup
pm2 save
```

### Verificar status
```bash
pm2 status
pm2 logs cinthiamed-backend
```

## 5️⃣ Configurar Firewall

### Abrir porta 5000 (temporário para teste)
```bash
ufw allow 5000/tcp
ufw allow 22/tcp  # SSH
ufw enable
```

### Testar backend
```bash
curl http://localhost:5000/health
```

Deve retornar: `{"status":"ok"...}`

## 6️⃣ Configurar NGINX (Proxy Reverso)

### Instalar NGINX
```bash
apt install -y nginx
```

### Criar configuração do site
```bash
nano /etc/nginx/sites-available/cinthiamed
```

Cole:
```nginx
server {
    listen 80;
    server_name seu-dominio.com www.seu-dominio.com;

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
    }
}
```

### Ativar site
```bash
ln -s /etc/nginx/sites-available/cinthiamed /etc/nginx/sites-enabled/
nginx -t  # Testar configuração
systemctl restart nginx
```

### Atualizar firewall
```bash
ufw allow 'Nginx Full'
ufw delete allow 5000/tcp  # Remover acesso direto
```

## 7️⃣ Instalar SSL (HTTPS)

### Instalar Certbot
```bash
apt install -y certbot python3-certbot-nginx
```

### Gerar certificado SSL
```bash
certbot --nginx -d seu-dominio.com -d www.seu-dominio.com
```

Siga as instruções. Certbot vai:
- Gerar certificado gratuito
- Configurar NGINX automaticamente
- Configurar renovação automática

### Testar renovação automática
```bash
certbot renew --dry-run
```

## 8️⃣ Deploy do Frontend na Vercel

### Atualizar URL da API no código
Depois que o backend estiver rodando, atualize as URLs no frontend:

Procure por `http://localhost:5000` e substitua por `https://seu-dominio.com`

### Fazer deploy na Vercel
```bash
# No seu computador local
git add .
git commit -m "chore: atualizar URL da API para produção"
git push
```

Depois importe o projeto na Vercel.

## 9️⃣ Comandos Úteis

### Ver logs do backend
```bash
pm2 logs cinthiamed-backend
```

### Reiniciar backend
```bash
pm2 restart cinthiamed-backend
```

### Parar backend
```bash
pm2 stop cinthiamed-backend
```

### Atualizar código
```bash
cd /var/www/CinthiaMed
git pull
cd server
npm install --production
pm2 restart cinthiamed-backend
```

### Ver status de todos os serviços
```bash
pm2 status
systemctl status nginx
systemctl status postgresql
```

## 🔟 Monitoramento

### Instalar PM2 Web Dashboard (opcional)
```bash
pm2 install pm2-server-monit
```

Acesse: `http://seu-ip:9615`

---

## ✅ Checklist Final

- [ ] Node.js instalado
- [ ] PostgreSQL configurado (ou Supabase)
- [ ] Projeto clonado e dependências instaladas
- [ ] Arquivo .env configurado
- [ ] PM2 rodando o backend
- [ ] NGINX configurado
- [ ] SSL instalado
- [ ] Firewall configurado
- [ ] Frontend deployado na Vercel
- [ ] URLs de API atualizadas

## 🆘 Troubleshooting

### Backend não inicia
```bash
pm2 logs cinthiamed-backend --lines 100
```

### Erro de conexão com banco
```bash
# Verificar se PostgreSQL está rodando
systemctl status postgresql

# Testar conexão
psql -U cinthia_user -d cinthiamed -h localhost
```

### Erro 502 Bad Gateway
```bash
# Verificar se backend está rodando
pm2 status
curl http://localhost:5000/health

# Reiniciar NGINX
systemctl restart nginx
```

---

**Custo estimado:** Apenas o que você já paga pela VPS Hetzner! 🎉
