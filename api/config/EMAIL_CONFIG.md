# 📧 Configuração de Emails - CinthiaMed

## Como Configurar o Envio de Emails

### 1. Obter API Key do Brevo (Sendinblue)

1. Acesse: https://www.brevo.com/
2. Crie uma conta gratuita (plano Free: 300 emails/dia)
3. Vá em **Account** → **SMTP & API** → **SMTP**
4. Copie a **SMTP Key**

### 2. Configurar Variáveis de Ambiente

Adicione no arquivo `.env` (ou nas variáveis de ambiente do Vercel):

```env
BREVO_API_KEY=sua_smtp_key_aqui
FRONTEND_URL=https://cinthiamed.vercel.app
```

**No Vercel:**
1. Vá em **Settings** → **Environment Variables**
2. Adicione `BREVO_API_KEY` com o valor da sua SMTP Key
3. Adicione `FRONTEND_URL` com a URL do seu app

### 3. Verificar Remetente no Brevo

⚠️ **IMPORTANTE**: O Brevo requer que você verifique o email remetente.

1. No Brevo, vá em **Settings** → **Senders**
2. Adicione o email `maycon.design16@gmail.com` (ou seu email)
3. Confirme pelo email de verificação que receberá

---

## Como Personalizar os Emails

### Arquivo de Templates

Edite o arquivo: **`api/config/emailTemplates.js`**

Este arquivo contém TODOS os textos e configurações dos emails.

### Exemplo: Alterar Email de Boas-Vindas

```javascript
// api/config/emailTemplates.js

module.exports = {
  welcome: {
    // Alterar título
    title: 'Seja bem-vindo!',

    // Alterar emoji do logo
    logoEmoji: '🎉',

    // Alterar mensagem de introdução
    intro: 'Ficamos muito felizes com sua chegada!',

    // Adicionar/remover funcionalidades
    features: [
      '✨ Consultas médicas baseadas em IA',
      '📚 Acesso a estudos científicos',
      '🧮 Calculadoras médicas',
      // Adicione mais aqui...
    ],

    // Alterar mensagem de encerramento
    closing: 'Aproveite todas as funcionalidades!',
  }
}
```

### Exemplo: Alterar Email de Recuperação de Senha

```javascript
// api/config/emailTemplates.js

module.exports = {
  passwordReset: {
    // Alterar título
    title: 'Esqueceu sua senha?',

    // Alterar texto do botão
    buttonText: 'Criar Nova Senha',

    // Alterar tempo de expiração
    expirationWarning: {
      title: '⏰ Link válido por 30 minutos',
      description: 'Por segurança, este link expira em 30 minutos.'
    }
  }
}
```

### Alterar Cores do Email

```javascript
// api/config/emailTemplates.js

module.exports = {
  styles: {
    colors: {
      primary: '#3b82f6',     // Azul em vez de roxo
      secondary: '#10b981',   // Verde em vez de rosa
      // ... outras cores
    }
  }
}
```

---

## Testar Envio de Emails

### 1. Testar Localmente

```bash
# No terminal do backend
node -e "
const { sendWelcomeEmail } = require('./api/services/emailService');
sendWelcomeEmail('seu-email@gmail.com', 'Seu Nome')
  .then(() => console.log('✅ Email enviado!'))
  .catch(err => console.error('❌ Erro:', err));
"
```

### 2. Testar em Produção

1. Crie uma nova conta no app
2. Verifique se recebeu o email de boas-vindas
3. Use "Esqueci minha senha" para testar recuperação

---

## Estrutura dos Emails

### Email de Boas-Vindas
- ✅ Enviado automaticamente no registro
- ✅ Não bloqueia o cadastro se falhar
- ✅ Template personalizável

### Email de Recuperação de Senha
- ✅ Enviado ao clicar "Esqueci minha senha"
- ✅ Link expira em 1 hora
- ✅ Falha no envio = erro para o usuário

---

## Troubleshooting

### Email não está sendo enviado

1. **Verifique a API Key:**
   ```bash
   echo $BREVO_API_KEY
   # Deve mostrar a SMTP Key, não a API Key REST
   ```

2. **Verifique o remetente:**
   - O email `maycon.design16@gmail.com` está verificado no Brevo?
   - Vá em Settings → Senders no painel do Brevo

3. **Verifique os logs:**
   ```bash
   # Logs do Vercel
   vercel logs

   # Procure por:
   # ✅ Email enviado
   # ❌ Erro ao enviar email
   ```

### Email cai no SPAM

1. **No Brevo**: Configure SPF e DKIM
   - Settings → Senders → Setup Instructions

2. **Use domínio próprio**:
   - Em vez de `@gmail.com`, use `@seudominio.com`
   - Configure DNS records (SPF, DKIM, DMARC)

### Alterar limite de 300 emails/dia

1. **Plano Free**: 300 emails/dia
2. **Upgrade**: A partir de $25/mês = 20.000 emails/mês
3. **Para produção**: Recomenda-se plano pago

---

## Suporte

**Dúvidas sobre configuração?**
- Brevo Support: https://help.brevo.com/
- Documentação SMTP: https://developers.brevo.com/docs/send-a-transactional-email

**Problemas no código?**
- Arquivo: `api/services/emailService.js`
- Templates: `api/config/emailTemplates.js`
