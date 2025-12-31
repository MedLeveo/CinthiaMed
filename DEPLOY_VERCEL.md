# 🚀 Deploy Completo na Vercel (Frontend + Backend)

## Arquitetura Final

- **Frontend:** React (Create React App) hospedado na Vercel
- **Backend:** Express.js como Serverless Functions na Vercel
- **Banco de dados:** Supabase PostgreSQL (gratuito)
- **Domínio:** `https://cinthiamed.vercel.app` (gratuito)

**Custo total: R$ 0,00** 🎉

---

## 📋 PASSO 1: Preparar Variáveis de Ambiente

Você vai precisar dessas credenciais:

### 1. OpenAI API Key
- Acesse: https://platform.openai.com/api-keys
- Crie uma nova chave
- Copie: `sk-proj-...`

### 2. Supabase Database URL
- Você já tem: `postgresql://postgres:KZx24fSgcwsTkNdWaGoK@db.yupuudqizbwbgdzpzwjl.supabase.co:5432/postgres`

### 3. Google OAuth
- Console: https://console.cloud.google.com/
- Credentials → OAuth 2.0 Client ID
- Copie: Client ID e Client Secret

### 4. Brevo SMTP Key
- Acesse: https://app.brevo.com/settings/keys/smtp
- Gere uma nova SMTP Key (não API Key!)
- Copie a chave

### 5. Session Secret
- Gere uma chave aleatória segura (mínimo 32 caracteres)
- Pode usar: https://randomkeygen.com/

---

## 🚀 PASSO 2: Deploy na Vercel

### 1. Acessar Vercel
- Vá em: https://vercel.com/
- Faça login com GitHub

### 2. Importar Projeto
- Clique em **"Add New..."** → **"Project"**
- Selecione o repositório: **MedLeveo/CinthiaMed**
- Clique em **"Import"**

### 3. Configurar Build Settings
A Vercel vai detectar automaticamente que é um projeto React.

**Framework Preset:** Create React App
**Root Directory:** `./`
**Build Command:** `npm run build` (já configurado)
**Output Directory:** `build` (já configurado)

### 4. Adicionar Variáveis de Ambiente

Clique em **"Environment Variables"** e adicione:

```
OPENAI_API_KEY=sk-proj-...
DATABASE_URL=postgresql://postgres:KZx24fSgcwsTkNdWaGoK@db.yupuudqizbwbgdzpzwjl.supabase.co:5432/postgres
GOOGLE_CLIENT_ID=seu_client_id_aqui
GOOGLE_CLIENT_SECRET=seu_secret_aqui
GOOGLE_CALLBACK_URL=https://cinthiamed.vercel.app/api/auth/google/callback
SESSION_SECRET=sua_chave_aleatoria_32_caracteres_aqui
BREVO_API_KEY=sua_smtp_key_aqui
FRONTEND_URL=https://cinthiamed.vercel.app
NODE_ENV=production
```

**IMPORTANTE:** Ajuste a `GOOGLE_CALLBACK_URL` e `FRONTEND_URL` com o domínio que a Vercel vai gerar (você pode editar depois).

### 5. Deploy!
- Clique em **"Deploy"**
- Aguarde 2-5 minutos
- ✅ Sua aplicação estará no ar!

---

## 📝 PASSO 3: Atualizar Configurações

### 1. Pegar URL do deploy
Após o deploy, a Vercel vai te dar uma URL tipo:
```
https://cinthiamed.vercel.app
```
ou
```
https://cinthiamed-abc123.vercel.app
```

### 2. Atualizar Google OAuth

Vá em: https://console.cloud.google.com/

**APIs & Services** → **Credentials** → Seu OAuth 2.0 Client ID

**Authorized JavaScript origins:**
- Adicione: `https://cinthiamed.vercel.app` (ou sua URL)

**Authorized redirect URIs:**
- Adicione: `https://cinthiamed.vercel.app/api/auth/google/callback`

Clique em **Save**.

### 3. Atualizar Variáveis de Ambiente na Vercel (se necessário)

Se a URL gerada for diferente de `cinthiamed.vercel.app`:

1. Vá em: **Settings** → **Environment Variables**
2. Edite:
   - `GOOGLE_CALLBACK_URL`
   - `FRONTEND_URL`
3. Coloque a URL correta
4. Clique em **"Redeploy"**

---

## ✅ PASSO 4: Testar Aplicação

### 1. Abrir aplicação
```
https://cinthiamed.vercel.app
```

### 2. Testar funcionalidades
- [ ] Criar conta com email/senha
- [ ] Login funciona
- [ ] Chat médico responde
- [ ] Login com Google funciona
- [ ] Gravação de consulta funciona
- [ ] Calculadoras funcionam
- [ ] Recuperação de senha (email chega)

---

## 🔧 Troubleshooting

### Erro: "API request failed"
- Verifique se todas as variáveis de ambiente estão configuradas
- Vá em Vercel → Settings → Environment Variables

### Erro: "Google OAuth não funciona"
- Verifique se atualizou os URIs no Google Cloud Console
- Verifique se `GOOGLE_CALLBACK_URL` está correto

### Erro: "Email não chega"
- Verifique se está usando SMTP Key (não API Key) do Brevo
- Teste na plataforma Brevo se a chave está ativa

### Erro: "Database connection failed"
- Verifique se a `DATABASE_URL` está correta
- Teste no Supabase se o banco está ativo

---

## 🎯 Domínio Customizado (Opcional)

Se quiser usar um domínio próprio (ex: `cinthiamed.com.br`):

1. Compre o domínio (Registro.br, GoDaddy, etc.)
2. Na Vercel: **Settings** → **Domains**
3. Adicione seu domínio
4. Configure os DNS conforme instruções da Vercel
5. Aguarde propagação (pode demorar até 48h)

---

## 📊 Limites do Plano Gratuito Vercel

- ✅ Banda: 100GB/mês
- ✅ Builds: 100 builds/mês
- ✅ Serverless Functions: Ilimitadas
- ✅ Timeout: 10 segundos (hobby) / 30 segundos (configurado)
- ✅ Mais que suficiente para o CinthiaMed!

---

## 🎉 Pronto!

Sua aplicação está no ar, 100% funcional e 100% gratuita!

**URL:** `https://cinthiamed.vercel.app`

🚀 **Deployment completo realizado com sucesso!**
