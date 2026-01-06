# 🎤 CinthiaMed Voice Service

Serviço de transcrição de voz médica usando **Faster Whisper** para o aplicativo CinthiaMed.

## 📖 Sobre

Este é um microserviço Python/FastAPI que fornece transcrição de áudio para texto otimizada para terminologia médica. Utiliza o [Faster Whisper](https://github.com/guillaumekln/faster-whisper), uma implementação otimizada do modelo Whisper da OpenAI.

### ✨ Características

- ✅ **Alta Precisão Médica**: Prompt otimizado para reconhecer termos médicos em português
- ✅ **Performance Otimizada**: Faster Whisper com computação INT8 para VPS
- ✅ **API RESTful**: Endpoints simples e bem documentados
- ✅ **CORS Configurado**: Pronto para integração com frontend
- ✅ **Segmentação de Áudio**: Retorna texto dividido em segmentos com timestamps
- ✅ **Suporta Múltiplos Formatos**: MP3, WAV, M4A, OGG, WebM
- ✅ **Filtro VAD**: Detecção de atividade de voz para melhor segmentação

## 🏗️ Arquitetura

```
┌─────────────────┐
│  Frontend React │
│   (CinthiaMed)  │
└────────┬────────┘
         │ HTTP/HTTPS
         │ POST /transcribe
         ▼
┌─────────────────┐
│  Nginx (Proxy)  │
│   Port 80/443   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   FastAPI App   │
│   Port 8000     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Faster Whisper  │
│  Model (base)   │
└─────────────────┘
```

## 🚀 Quick Start

### Pré-requisitos

- Python 3.8+
- FFmpeg
- 4GB RAM mínimo (recomendado: 8GB)

### Instalação Local

```bash
# 1. Clone o repositório
git clone https://github.com/seu-usuario/cinthiamed.git
cd cinthiamed/whisper-service

# 2. Crie ambiente virtual
python3 -m venv venv
source venv/bin/activate  # No Windows: venv\Scripts\activate

# 3. Instale dependências
pip install -r requirements.txt

# 4. Configure variáveis de ambiente
cp .env.example .env

# 5. Execute o servidor
python app.py
```

O serviço estará disponível em `http://localhost:8000`

## 📚 Endpoints

### `GET /`
Informações básicas do serviço

**Resposta:**
```json
{
  "service": "CinthiaMed Voice Service",
  "status": "online",
  "model": "base",
  "model_loaded": true
}
```

### `GET /health`
Health check do serviço

**Resposta:**
```json
{
  "status": "healthy",
  "model": "base",
  "device": "cpu"
}
```

### `POST /transcribe`
Transcreve áudio completo com segmentação

**Parâmetros:**
- `audio` (file, obrigatório): Arquivo de áudio
- `language` (string, opcional): Código do idioma (padrão: "pt")
- `initial_prompt` (string, opcional): Prompt customizado

**Exemplo:**
```bash
curl -X POST http://localhost:8000/transcribe \
  -F "audio=@consulta.mp3" \
  -F "language=pt"
```

**Resposta:**
```json
{
  "success": true,
  "text": "Paciente com febre há 3 dias...",
  "segments": [
    {
      "start": 0.0,
      "end": 2.5,
      "text": "Paciente com febre há 3 dias"
    }
  ],
  "metadata": {
    "language": "pt",
    "language_probability": 0.998,
    "duration": 45.2,
    "model": "base"
  }
}
```

### `POST /transcribe-streaming`
Transcrição rápida (apenas texto final)

**Parâmetros:**
- `audio` (file, obrigatório): Arquivo de áudio
- `language` (string, opcional): Código do idioma

**Resposta:**
```json
{
  "success": true,
  "text": "Paciente com febre há 3 dias...",
  "language": "pt"
}
```

## ⚙️ Configuração

### Variáveis de Ambiente

| Variável | Descrição | Padrão |
|----------|-----------|--------|
| `PORT` | Porta do servidor | 8000 |
| `WHISPER_MODEL_SIZE` | Tamanho do modelo (tiny/base/small/medium/large-v3) | base |
| `DEVICE` | Dispositivo (cpu/cuda) | cpu |
| `COMPUTE_TYPE` | Tipo de computação (int8/float16/float32) | int8 |

### Escolha do Modelo

| Modelo | RAM Necessária | Precisão | Velocidade | Uso Recomendado |
|--------|----------------|----------|------------|-----------------|
| tiny | ~1GB | ⭐⭐ | ⚡⚡⚡ | Testes rápidos |
| base | ~1.5GB | ⭐⭐⭐ | ⚡⚡⚡ | **VPS 4GB (Recomendado)** |
| small | ~2.5GB | ⭐⭐⭐⭐ | ⚡⚡ | VPS 8GB+ |
| medium | ~5GB | ⭐⭐⭐⭐⭐ | ⚡ | VPS 16GB+ |
| large-v3 | ~10GB | ⭐⭐⭐⭐⭐ | ⚡ | GPU dedicada |

## 🌐 Deploy

### VPS (Hetzner/DigitalOcean/AWS)

Siga o guia completo: **[DEPLOY.md](./DEPLOY.md)**

Resumo:
1. Instalar Python 3.8+ e FFmpeg
2. Clonar repositório
3. Configurar systemd service
4. Configurar Nginx como proxy reverso
5. (Opcional) Configurar SSL com Certbot

### Docker (Em breve)

```bash
docker build -t cinthiamed-voice .
docker run -p 8000:8000 cinthiamed-voice
```

## 🧪 Testes

### Teste Manual

```bash
# Ativar ambiente virtual
source venv/bin/activate

# Executar script de teste
python test_transcription.py caminho/para/audio.mp3
```

### Teste com cURL

```bash
# Health check
curl http://localhost:8000/health

# Transcrição
curl -X POST http://localhost:8000/transcribe \
  -F "audio=@test.mp3" \
  -F "language=pt"
```

## 🔗 Integração Frontend

Veja o guia completo: **[FRONTEND_INTEGRATION.md](./FRONTEND_INTEGRATION.md)**

Exemplo rápido:

```javascript
const formData = new FormData();
formData.append('audio', audioBlob, 'recording.webm');
formData.append('language', 'pt');

const response = await fetch('http://localhost:8000/transcribe', {
  method: 'POST',
  body: formData,
});

const result = await response.json();
console.log(result.text);
```

## 📊 Performance

### Benchmarks (VPS 4GB, modelo base)

| Duração do Áudio | Tempo de Processamento | CPU | RAM |
|------------------|------------------------|-----|-----|
| 10 segundos | ~2 segundos | 80% | 1.2GB |
| 30 segundos | ~5 segundos | 80% | 1.3GB |
| 60 segundos | ~10 segundos | 80% | 1.5GB |
| 120 segundos | ~20 segundos | 80% | 1.8GB |

### Otimizações

- ✅ Modelo INT8 (4x menor que Float32)
- ✅ VAD Filter (reduz processamento de silêncios)
- ✅ Beam size otimizado (5 para qualidade/velocidade)
- ✅ Cache de modelos (download único)

## 🔒 Segurança

### Boas Práticas Implementadas

- ✅ Validação de tipo de arquivo
- ✅ Limite de tamanho (25MB)
- ✅ Limpeza automática de arquivos temporários
- ✅ CORS configurado
- ⚠️ **TODO**: Adicionar autenticação (API Key/JWT)
- ⚠️ **TODO**: Rate limiting

### Recomendações

1. **Use HTTPS em produção** (configure com Certbot)
2. **Implemente autenticação** se expor publicamente
3. **Configure firewall** (ufw/iptables)
4. **Monitore logs** regularmente

## 🐛 Troubleshooting

### Problema: "Model not loaded"

```bash
# Baixar modelo manualmente
python3 -c "from faster_whisper import WhisperModel; WhisperModel('base', download_root='./models')"
```

### Problema: "Out of memory"

- Reduza o modelo: `WHISPER_MODEL_SIZE=tiny`
- Feche outros processos
- Aumente swap da VPS

### Problema: "FFmpeg not found"

```bash
# Ubuntu/Debian
sudo apt install ffmpeg

# MacOS
brew install ffmpeg

# Windows
# Baixe em: https://ffmpeg.org/download.html
```

### Problema: Transcrição incorreta

- Use `initial_prompt` com termos específicos
- Aumente o modelo (base → small)
- Verifique qualidade do áudio (ruído, cortes)

## 📁 Estrutura do Projeto

```
whisper-service/
├── app.py                      # Aplicação FastAPI principal
├── requirements.txt            # Dependências Python
├── .env.example               # Exemplo de variáveis de ambiente
├── .gitignore                 # Arquivos ignorados pelo Git
├── README.md                  # Este arquivo
├── DEPLOY.md                  # Guia de deploy na VPS
├── FRONTEND_INTEGRATION.md    # Guia de integração frontend
├── test_transcription.py      # Script de testes
└── models/                    # Cache dos modelos Whisper (auto-criado)
```

## 🤝 Contribuindo

Contribuições são bem-vindas! Por favor:

1. Faça fork do projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

## 📄 Licença

Este projeto é parte do CinthiaMed e segue a mesma licença.

## 🆘 Suporte

- **Documentação**: Leia os arquivos `.md` neste diretório
- **Issues**: Abra uma issue no GitHub
- **Email**: [seu-email@exemplo.com]

## 🙏 Agradecimentos

- [OpenAI Whisper](https://github.com/openai/whisper) - Modelo base
- [Faster Whisper](https://github.com/guillaumekln/faster-whisper) - Implementação otimizada
- [FastAPI](https://fastapi.tiangolo.com/) - Framework web

---

**Desenvolvido com ❤️ para CinthiaMed** 🏥
