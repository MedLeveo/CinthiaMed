# ⚡ Quick Start - CinthiaMed Voice Service

Guia rápido para colocar o serviço de voz funcionando na sua VPS Hetzner em **15 minutos**.

---

## 🎯 Opção 1: Instalação Automática (Recomendado)

### 1. Conecte na sua VPS

```bash
ssh root@SEU_IP_DA_VPS
```

### 2. Transfira os arquivos

**Opção A: Via Git (se o projeto está no GitHub)**

```bash
cd /home
git clone https://github.com/seu-usuario/cinthiamed.git
cd cinthiamed/whisper-service
```

**Opção B: Via SCP (do seu computador)**

```bash
# No seu computador (Git Bash/PowerShell)
scp -r whisper-service root@SEU_IP:/home/cinthiamed/
```

### 3. Execute o instalador automático

```bash
cd /home/cinthiamed/whisper-service
chmod +x manage.sh
./manage.sh install
```

Isso vai:
- ✅ Verificar dependências (Python, FFmpeg)
- ✅ Criar ambiente virtual
- ✅ Instalar pacotes Python
- ✅ Configurar arquivo .env

### 4. Teste se funciona

```bash
./manage.sh test
```

Você deve ver:
```
INFO:     Carregando modelo Whisper: base
INFO:     Modelo Whisper carregado com sucesso!
INFO:     Uvicorn running on http://0.0.0.0:8000
```

**Abra outro terminal** e teste:

```bash
ssh root@SEU_IP_DA_VPS
curl http://localhost:8000/health
```

Se retornar JSON, está funcionando! ✅

Pressione `Ctrl+C` no primeiro terminal para parar.

### 5. Instale como serviço (rodar sempre)

```bash
sudo ./manage.sh install-service
./manage.sh start
./manage.sh status
```

Pronto! O serviço está rodando e vai reiniciar automaticamente se cair. 🎉

---

## 🎯 Opção 2: Instalação Manual

Se preferir fazer passo a passo:

### 1. Preparar sistema

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install python3 python3-pip python3-venv ffmpeg -y
```

### 2. Configurar projeto

```bash
cd /home/cinthiamed/whisper-service
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 3. Configurar ambiente

```bash
cp .env.example .env
nano .env  # Configure se necessário
```

### 4. Testar

```bash
python3 app.py
```

### 5. Configurar como serviço

```bash
sudo nano /etc/systemd/system/cinthiamed-voice.service
```

Cole:

```ini
[Unit]
Description=CinthiaMed Voice Service
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/home/cinthiamed/whisper-service
Environment="PATH=/home/cinthiamed/whisper-service/venv/bin"
ExecStart=/home/cinthiamed/whisper-service/venv/bin/python3 app.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Ative:

```bash
sudo systemctl daemon-reload
sudo systemctl enable cinthiamed-voice
sudo systemctl start cinthiamed-voice
sudo systemctl status cinthiamed-voice
```

---

## 🌐 Configurar Nginx (Proxy Reverso)

### 1. Instalar Nginx

```bash
sudo apt install nginx -y
```

### 2. Configurar site

```bash
sudo cp nginx.conf.example /etc/nginx/sites-available/cinthiamed-voice
```

Edite e ajuste o `server_name`:

```bash
sudo nano /etc/nginx/sites-available/cinthiamed-voice
```

Altere:
```nginx
server_name voice.cinthiamed.com.br;  # Seu domínio
```

### 3. Ativar

```bash
sudo ln -s /etc/nginx/sites-available/cinthiamed-voice /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 4. Configurar Firewall

```bash
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### 5. SSL (HTTPS) - Opcional

```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d voice.cinthiamed.com.br
```

---

## ✅ Verificar se está tudo OK

### Teste local (na VPS):

```bash
curl http://localhost:8000/health
```

### Teste via Nginx (do seu computador):

```bash
curl http://SEU_IP/health
# ou
curl https://voice.cinthiamed.com.br/health
```

Deve retornar:

```json
{
  "status": "healthy",
  "model": "base",
  "device": "cpu"
}
```

---

## 🧪 Testar Transcrição

### Do seu computador:

```bash
# Baixar áudio de teste
curl -O https://www2.cs.uic.edu/~i101/SoundFiles/taunt.wav

# Transcrever
curl -X POST http://SEU_IP/transcribe \
  -F "audio=@taunt.wav" \
  -F "language=en"
```

### Da VPS:

```bash
cd /home/cinthiamed/whisper-service
source venv/bin/activate
python3 test_transcription.py caminho/para/audio.mp3
```

---

## 📱 Integrar com Frontend

### 1. Adicione no `.env` do frontend:

```env
REACT_APP_VOICE_SERVICE_URL=https://voice.cinthiamed.com.br
```

### 2. Código de exemplo:

```javascript
// Enviar áudio para transcrição
const formData = new FormData();
formData.append('audio', audioBlob, 'recording.webm');
formData.append('language', 'pt');

const response = await fetch(
  `${process.env.REACT_APP_VOICE_SERVICE_URL}/transcribe`,
  {
    method: 'POST',
    body: formData,
  }
);

const result = await response.json();
console.log('Transcrição:', result.text);
```

Veja detalhes completos em: **[FRONTEND_INTEGRATION.md](./FRONTEND_INTEGRATION.md)**

---

## 🔧 Comandos Úteis

```bash
# Ver logs em tempo real
./manage.sh logs

# Reiniciar serviço
./manage.sh restart

# Ver status
./manage.sh status

# Health check
./manage.sh health

# Baixar modelo específico
./manage.sh download-model small

# Limpar cache
./manage.sh clean
```

---

## ⚙️ Ajustar Performance

Se sua VPS tiver **pouca RAM** (2-4GB):

```bash
nano .env
```

Altere:
```env
WHISPER_MODEL_SIZE=tiny  # ou base
```

Se tiver **8GB+ RAM**:
```env
WHISPER_MODEL_SIZE=small  # ou medium
```

Reinicie:
```bash
./manage.sh restart
```

---

## 🐛 Problemas Comuns

### "Out of memory"

```bash
# Reduzir modelo
nano .env
# Altere: WHISPER_MODEL_SIZE=tiny

./manage.sh restart
```

### "FFmpeg not found"

```bash
sudo apt install ffmpeg -y
```

### "Port 8000 already in use"

```bash
# Ver o que está usando
sudo lsof -i :8000

# Matar processo
sudo kill -9 PID
```

### "Model not loaded"

```bash
# Baixar manualmente
./manage.sh download-model base
./manage.sh restart
```

---

## 📊 Monitorar Recursos

```bash
# CPU e RAM
htop

# Logs do serviço
./manage.sh logs

# Status
./manage.sh status
```

---

## 🎓 Próximos Passos

1. ✅ Serviço funcionando
2. ✅ Nginx configurado
3. ✅ SSL ativado
4. 📱 Integrar com frontend
5. 🔒 Adicionar autenticação (API Key)
6. 📊 Configurar monitoramento

---

## 📚 Documentação Completa

- **[README.md](./README.md)** - Documentação completa do projeto
- **[DEPLOY.md](./DEPLOY.md)** - Guia detalhado de deploy
- **[FRONTEND_INTEGRATION.md](./FRONTEND_INTEGRATION.md)** - Integração com React

---

## 🆘 Ajuda

Se encontrar problemas:

1. **Verifique logs**: `./manage.sh logs`
2. **Teste health**: `curl http://localhost:8000/health`
3. **Veja status**: `./manage.sh status`
4. **Abra uma issue** no GitHub

---

**Tempo estimado de configuração**: ~15 minutos ⏱️

**Desenvolvido para CinthiaMed** 🏥
