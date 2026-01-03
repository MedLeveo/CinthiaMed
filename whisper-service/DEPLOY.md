# 🚀 Deploy do CinthiaMed Voice Service na VPS Hetzner

Este guia completo vai te ajudar a configurar o serviço de transcrição de voz usando Faster Whisper na sua VPS.

## 📋 Pré-requisitos

- VPS Hetzner rodando Ubuntu/Debian (recomendado: 4GB RAM mínimo)
- Acesso SSH à VPS
- Python 3.8 ou superior
- FFmpeg instalado

---

## 🛠️ Passo 1: Conectar na VPS

```bash
ssh root@SEU_IP_DA_VPS
# ou
ssh seu-usuario@SEU_IP_DA_VPS
```

---

## 📦 Passo 2: Preparar o Sistema

### Atualizar pacotes do sistema
```bash
sudo apt update && sudo apt upgrade -y
```

### Instalar dependências essenciais
```bash
# Python 3 e pip
sudo apt install python3 python3-pip python3-venv -y

# FFmpeg (essencial para processar áudio)
sudo apt install ffmpeg -y

# Ferramentas de desenvolvimento
sudo apt install build-essential -y
```

### Verificar instalações
```bash
python3 --version  # Deve ser 3.8+
ffmpeg -version    # Confirmar instalação
```

---

## 📁 Passo 3: Transferir os Arquivos

### Opção A: Usando Git (Recomendado)

Se seu projeto está no GitHub/GitLab:

```bash
# Na VPS
cd /home
git clone https://github.com/seu-usuario/cinthiamed.git
cd cinthiamed/whisper-service
```

### Opção B: Usando SCP (Do seu computador local)

```bash
# No seu computador Windows (PowerShell ou Git Bash)
cd c:\Users\mayco\Pictures\sdasd\cinthiamed

# Transferir a pasta whisper-service
scp -r whisper-service root@SEU_IP_DA_VPS:/home/cinthiamed/
```

### Opção C: Criar manualmente na VPS

```bash
# Na VPS
mkdir -p /home/cinthiamed/whisper-service
cd /home/cinthiamed/whisper-service

# Depois use nano ou vim para criar os arquivos
nano app.py  # Cole o conteúdo do app.py
nano requirements.txt  # Cole o conteúdo
```

---

## 🔧 Passo 4: Configurar o Ambiente Python

```bash
# Navegar para o diretório
cd /home/cinthiamed/whisper-service

# Criar ambiente virtual
python3 -m venv venv

# Ativar ambiente virtual
source venv/bin/activate

# Atualizar pip
pip install --upgrade pip

# Instalar dependências
pip install -r requirements.txt
```

⏳ **Nota**: A instalação pode demorar alguns minutos, especialmente o `faster-whisper`.

---

## ⚙️ Passo 5: Configurar Variáveis de Ambiente

```bash
# Criar arquivo .env
cp .env.example .env

# Editar configurações
nano .env
```

Configure conforme a capacidade da sua VPS:

```env
PORT=8000
WHISPER_MODEL_SIZE=base  # ou 'small' se tiver 8GB+ RAM
DEVICE=cpu
COMPUTE_TYPE=int8
```

**Recomendações de modelo por RAM:**
- 2GB RAM: `tiny`
- 4GB RAM: `base` ✅ (recomendado para início)
- 8GB+ RAM: `small` ou `medium`

---

## 🧪 Passo 6: Testar o Serviço

```bash
# Rodar o servidor de teste
python3 app.py
```

Deve aparecer algo como:
```
INFO:     Started server process [12345]
INFO:     Waiting for application startup.
INFO:     Carregando modelo Whisper: base
INFO:     Modelo Whisper carregado com sucesso!
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8000
```

### Testar em outro terminal:

```bash
# Abrir nova janela SSH
ssh root@SEU_IP_DA_VPS

# Testar health check
curl http://localhost:8000/health
```

Se retornar JSON com `"status": "healthy"`, está funcionando! ✅

Pressione `Ctrl+C` para parar o servidor de teste.

---

## 🔄 Passo 7: Configurar para Rodar em Produção

Vamos usar **systemd** para manter o serviço sempre ativo.

### Criar arquivo de serviço

```bash
sudo nano /etc/systemd/system/cinthiamed-voice.service
```

Cole este conteúdo:

```ini
[Unit]
Description=CinthiaMed Voice Service (Faster Whisper)
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/home/cinthiamed/whisper-service
Environment="PATH=/home/cinthiamed/whisper-service/venv/bin"
ExecStart=/home/cinthiamed/whisper-service/venv/bin/python3 app.py
Restart=always
RestartSec=10

# Limites de recursos (ajuste conforme necessário)
MemoryLimit=2G
CPUQuota=80%

[Install]
WantedBy=multi-user.target
```

### Ativar e iniciar o serviço

```bash
# Recarregar systemd
sudo systemctl daemon-reload

# Habilitar para iniciar com o sistema
sudo systemctl enable cinthiamed-voice

# Iniciar o serviço
sudo systemctl start cinthiamed-voice

# Verificar status
sudo systemctl status cinthiamed-voice
```

### Comandos úteis:

```bash
# Ver logs em tempo real
sudo journalctl -u cinthiamed-voice -f

# Reiniciar serviço
sudo systemctl restart cinthiamed-voice

# Parar serviço
sudo systemctl stop cinthiamed-voice
```

---

## 🔥 Passo 8: Configurar Firewall (Segurança)

```bash
# Permitir porta 8000 (apenas se necessário acesso direto)
sudo ufw allow 8000/tcp

# Ou se usar Nginx como proxy reverso (recomendado):
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Ativar firewall
sudo ufw enable
```

---

## 🌐 Passo 9: Configurar Nginx (Proxy Reverso) - RECOMENDADO

### Instalar Nginx

```bash
sudo apt install nginx -y
```

### Criar configuração

```bash
sudo nano /etc/nginx/sites-available/cinthiamed-voice
```

Cole:

```nginx
server {
    listen 80;
    server_name voice.cinthiamed.com.br;  # Seu domínio/IP

    client_max_body_size 25M;  # Máximo de upload

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;

        # Timeout para uploads grandes
        proxy_connect_timeout 300;
        proxy_send_timeout 300;
        proxy_read_timeout 300;
    }
}
```

### Ativar site

```bash
# Criar link simbólico
sudo ln -s /etc/nginx/sites-available/cinthiamed-voice /etc/nginx/sites-enabled/

# Testar configuração
sudo nginx -t

# Reiniciar Nginx
sudo systemctl restart nginx
```

---

## 🔒 Passo 10: Configurar SSL (HTTPS) - Opcional mas Recomendado

```bash
# Instalar Certbot
sudo apt install certbot python3-certbot-nginx -y

# Obter certificado SSL
sudo certbot --nginx -d voice.cinthiamed.com.br

# Renovação automática já está configurada
```

---

## ✅ Verificação Final

### Testar endpoint local:

```bash
curl http://localhost:8000/health
```

### Testar via Nginx:

```bash
curl http://SEU_IP_DA_VPS/health
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

## 🧪 Testando Transcrição

Você pode testar com um arquivo de áudio de teste:

```bash
# Baixar um áudio de teste
wget https://www2.cs.uic.edu/~i101/SoundFiles/taunt.wav -O test.wav

# Testar transcrição
curl -X POST http://localhost:8000/transcribe \
  -F "audio=@test.wav" \
  -F "language=pt"
```

---

## 📊 Monitoramento

### Ver uso de recursos:

```bash
# CPU e RAM
htop

# Processos Python
ps aux | grep python

# Logs do serviço
sudo journalctl -u cinthiamed-voice -f --lines=100
```

---

## 🔧 Resolução de Problemas

### Problema: "Model not found"
```bash
# Baixar manualmente o modelo
cd /home/cinthiamed/whisper-service
source venv/bin/activate
python3 -c "from faster_whisper import WhisperModel; WhisperModel('base', download_root='./models')"
```

### Problema: "Out of memory"
- Reduza o modelo: `WHISPER_MODEL_SIZE=tiny`
- Aumente swap da VPS
- Upgrade do plano da VPS

### Problema: Serviço não inicia
```bash
# Ver logs detalhados
sudo journalctl -u cinthiamed-voice -n 50 --no-pager

# Verificar permissões
ls -la /home/cinthiamed/whisper-service
```

### Problema: Timeout em uploads
- Aumente os timeouts no Nginx (já configurado acima)
- Verifique firewall: `sudo ufw status`

---

## 🚀 Próximos Passos

1. **Integrar com o Frontend**: Adicione o endpoint da VPS no seu frontend React
2. **Adicionar autenticação**: JWT ou API Key para segurança
3. **Configurar backup**: Automatize backup dos logs e configurações
4. **Monitoramento**: Configure alertas com Grafana/Prometheus

---

## 📝 URLs Importantes

- **Health Check**: `http://SEU_IP:8000/health`
- **Transcrição**: `POST http://SEU_IP:8000/transcribe`
- **Transcrição Rápida**: `POST http://SEU_IP:8000/transcribe-streaming`

---

## 💡 Dicas de Performance

1. **Cache de modelos**: Os modelos Whisper são salvos em `./models/` na primeira execução
2. **Otimização de RAM**: Use `COMPUTE_TYPE=int8` para reduzir uso de memória
3. **Processamento paralelo**: Uvicorn já gerencia múltiplas requisições
4. **Logs**: Rotacione logs para evitar disco cheio

---

## 🆘 Suporte

Se encontrar problemas:
1. Verifique os logs: `sudo journalctl -u cinthiamed-voice -f`
2. Teste a API: `curl http://localhost:8000/health`
3. Valide FFmpeg: `ffmpeg -version`

---

**Desenvolvido para CinthiaMed** 🏥
