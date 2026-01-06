# 📁 Estrutura do Projeto - CinthiaMed Voice Service

## 🗂️ Visão Geral

```
whisper-service/
│
├── 🐍 CÓDIGO PRINCIPAL
│   ├── app.py                          # Aplicação FastAPI principal
│   └── requirements.txt                # Dependências Python
│
├── ⚙️ CONFIGURAÇÃO
│   ├── .env.example                    # Exemplo de variáveis de ambiente
│   ├── .gitignore                      # Arquivos ignorados pelo Git
│   └── nginx.conf.example              # Configuração Nginx pronta
│
├── 📚 DOCUMENTAÇÃO
│   ├── README.md                       # Documentação completa do projeto
│   ├── QUICKSTART.md                   # Guia rápido (15 minutos)
│   ├── DEPLOY.md                       # Deploy detalhado na VPS
│   ├── FRONTEND_INTEGRATION.md         # Integração com React
│   └── ESTRUTURA.md                    # Este arquivo
│
├── 🧪 TESTES E EXEMPLOS
│   ├── test_transcription.py           # Script de teste do serviço
│   └── client_example.py               # Exemplos de uso em Python
│
└── 🛠️ UTILITÁRIOS
    └── manage.sh                       # Script de gerenciamento (install, start, stop, etc.)
```

---

## 📄 Descrição dos Arquivos

### 🐍 Código Principal

#### [app.py](app.py)
**O coração do serviço**

- Aplicação FastAPI completa
- Endpoints: `/`, `/health`, `/transcribe`, `/transcribe-streaming`
- Integração com Faster Whisper
- Processamento de áudio médico otimizado
- Logs estruturados
- Tratamento de erros robusto

**Principais funcionalidades:**
- ✅ Transcrição de áudio para texto
- ✅ Suporte a múltiplos formatos (MP3, WAV, WebM, OGG, M4A)
- ✅ Prompt médico otimizado
- ✅ Segmentação com timestamps
- ✅ VAD (Voice Activity Detection)
- ✅ CORS configurado

#### [requirements.txt](requirements.txt)
**Dependências do projeto**

```txt
fastapi==0.115.6              # Framework web
uvicorn==0.34.0               # Servidor ASGI
faster-whisper==1.1.0         # Motor de transcrição
python-multipart==0.0.20      # Upload de arquivos
ffmpeg-python==0.2.0          # Processamento de áudio
python-dotenv==1.0.1          # Variáveis de ambiente
```

---

### ⚙️ Configuração

#### [.env.example](.env.example)
**Template de variáveis de ambiente**

```env
PORT=8000                     # Porta do servidor
WHISPER_MODEL_SIZE=base       # tiny/base/small/medium/large-v3
DEVICE=cpu                    # cpu ou cuda
COMPUTE_TYPE=int8             # int8/float16/float32
```

**Copie para `.env` e customize conforme sua VPS**

#### [.gitignore](.gitignore)
**Arquivos ignorados pelo Git**

Protege:
- Ambiente virtual (`venv/`)
- Variáveis sensíveis (`.env`)
- Modelos baixados (`models/`)
- Arquivos temporários (`*.tmp`)

#### [nginx.conf.example](nginx.conf.example)
**Configuração Nginx pronta para usar**

Inclui:
- ✅ Proxy reverso para FastAPI
- ✅ Rate limiting (10 req/min)
- ✅ Upload de até 25MB
- ✅ Headers de segurança
- ✅ Timeouts otimizados
- ✅ Configuração SSL comentada (ative após Certbot)

**Uso:**
```bash
sudo cp nginx.conf.example /etc/nginx/sites-available/cinthiamed-voice
```

---

### 📚 Documentação

#### [README.md](README.md)
**Documentação completa e oficial**

Conteúdo:
- 📖 Introdução e características
- 🏗️ Arquitetura do sistema
- 🚀 Instalação local
- 📚 Documentação da API
- ⚙️ Configurações detalhadas
- 🧪 Como testar
- 🔗 Integração com frontend
- 📊 Benchmarks de performance
- 🔒 Segurança
- 🐛 Troubleshooting

**Para quem:** Desenvolvedores que querem entender o projeto completo

#### [QUICKSTART.md](QUICKSTART.md)
**Guia rápido de 15 minutos**

- ⚡ Instalação automática com `manage.sh`
- ⚡ Instalação manual passo a passo
- ⚡ Configuração de Nginx
- ⚡ SSL com Certbot
- ⚡ Verificação rápida
- ⚡ Comandos úteis

**Para quem:** Quem quer colocar online o mais rápido possível

#### [DEPLOY.md](DEPLOY.md)
**Guia completo de deploy na VPS**

10 passos detalhados:
1. Conectar na VPS
2. Preparar o sistema
3. Transferir arquivos
4. Configurar ambiente Python
5. Configurar variáveis
6. Testar serviço
7. Configurar systemd
8. Configurar firewall
9. Configurar Nginx
10. Configurar SSL

**Para quem:** Deploy em produção pela primeira vez

#### [FRONTEND_INTEGRATION.md](FRONTEND_INTEGRATION.md)
**Integração com React**

Inclui:
- 🎤 Componente de gravação completo (`VoiceRecorder.jsx`)
- 🎨 CSS com animações
- 🔗 Exemplos de integração no chat
- 📎 Upload de arquivo de áudio
- 🔐 Tratamento de erros
- 📱 Suporte mobile
- 💡 Dicas de UX

**Para quem:** Desenvolvedores frontend integrando o serviço

---

### 🧪 Testes e Exemplos

#### [test_transcription.py](test_transcription.py)
**Script de teste automatizado**

Funções:
- ✅ `test_health()` - Verifica se serviço está online
- ✅ `test_transcription(audio_file)` - Testa transcrição completa

**Uso:**
```bash
python test_transcription.py              # Apenas health check
python test_transcription.py audio.mp3    # Transcrever arquivo
```

#### [client_example.py](client_example.py)
**Biblioteca cliente Python + Exemplos**

Classe `VoiceClient`:
- `health_check()` - Verificar status
- `transcribe(audio)` - Transcrição completa
- `transcribe_streaming(audio)` - Transcrição rápida

**5 exemplos incluídos:**
1. **Uso básico** - Transcrição simples
2. **Contexto médico** - Com prompt customizado
3. **Processamento em lote** - Múltiplos arquivos
4. **Tratamento de erros** - Cenários de falha
5. **Modo interativo** - Interface CLI

**Uso:**
```bash
python client_example.py interactive       # Modo interativo
python client_example.py example1          # Exemplo básico
python client_example.py example2          # Contexto médico
```

---

### 🛠️ Utilitários

#### [manage.sh](manage.sh)
**Script de gerenciamento all-in-one**

Comandos disponíveis:

**Instalação:**
- `./manage.sh install` - Instala tudo automaticamente
- `./manage.sh install-service` - Configura systemd

**Operação:**
- `./manage.sh start` - Inicia serviço
- `./manage.sh stop` - Para serviço
- `./manage.sh restart` - Reinicia serviço
- `./manage.sh status` - Ver status
- `./manage.sh logs` - Logs em tempo real

**Testes:**
- `./manage.sh test` - Servidor de teste
- `./manage.sh health` - Health check

**Manutenção:**
- `./manage.sh download-model [size]` - Baixa modelo específico
- `./manage.sh clean` - Limpa cache
- `./manage.sh uninstall` - Remove tudo

**Ajuda:**
- `./manage.sh help` - Mostra todos os comandos

---

## 🔄 Fluxo de Trabalho Recomendado

### 1️⃣ Primeira Vez (Desenvolvimento Local)

```bash
# 1. Ler documentação
cat README.md

# 2. Instalar
./manage.sh install

# 3. Testar
./manage.sh test

# 4. Verificar
./manage.sh health
```

### 2️⃣ Deploy na VPS

```bash
# 1. Seguir guia rápido
cat QUICKSTART.md

# 2. Ou guia detalhado
cat DEPLOY.md

# 3. Instalar como serviço
sudo ./manage.sh install-service
./manage.sh start
```

### 3️⃣ Integração Frontend

```bash
# 1. Ler guia de integração
cat FRONTEND_INTEGRATION.md

# 2. Copiar componente VoiceRecorder
# 3. Configurar .env do frontend
# 4. Testar no browser
```

### 4️⃣ Testes e Validação

```bash
# 1. Teste automatizado
python test_transcription.py audio.mp3

# 2. Exemplos Python
python client_example.py interactive

# 3. Teste via cURL
curl http://localhost:8000/health
```

---

## 📊 Matriz de Uso

| Arquivo | Iniciante | Avançado | DevOps | Frontend |
|---------|-----------|----------|--------|----------|
| **QUICKSTART.md** | ⭐⭐⭐ | ⭐ | ⭐⭐ | ⭐ |
| **README.md** | ⭐⭐ | ⭐⭐⭐ | ⭐⭐ | ⭐ |
| **DEPLOY.md** | ⭐⭐ | ⭐⭐ | ⭐⭐⭐ | - |
| **FRONTEND_INTEGRATION.md** | ⭐ | ⭐ | - | ⭐⭐⭐ |
| **manage.sh** | ⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐ | - |
| **test_transcription.py** | ⭐⭐ | ⭐⭐⭐ | ⭐⭐ | - |
| **client_example.py** | ⭐ | ⭐⭐⭐ | ⭐ | ⭐⭐ |

---

## 🎯 Por Onde Começar?

### Você é Iniciante?
1. Leia: [QUICKSTART.md](QUICKSTART.md)
2. Execute: `./manage.sh install`
3. Teste: `./manage.sh test`

### Você é Desenvolvedor?
1. Leia: [README.md](README.md)
2. Teste: `python client_example.py interactive`
3. Integre: [FRONTEND_INTEGRATION.md](FRONTEND_INTEGRATION.md)

### Você é DevOps?
1. Leia: [DEPLOY.md](DEPLOY.md)
2. Configure: Nginx + systemd
3. Monitore: `./manage.sh logs`

### Você é Frontend?
1. Leia: [FRONTEND_INTEGRATION.md](FRONTEND_INTEGRATION.md)
2. Copie: Componente VoiceRecorder
3. Configure: `.env` do React

---

## 📞 Arquivos de Suporte

| Precisa de | Arquivo |
|------------|---------|
| Instalar rapidamente | [QUICKSTART.md](QUICKSTART.md) |
| Deploy em produção | [DEPLOY.md](DEPLOY.md) |
| Entender a API | [README.md](README.md) |
| Integrar frontend | [FRONTEND_INTEGRATION.md](FRONTEND_INTEGRATION.md) |
| Testar serviço | [test_transcription.py](test_transcription.py) |
| Exemplos de código | [client_example.py](client_example.py) |
| Gerenciar serviço | [manage.sh](manage.sh) |

---

## 🔗 Arquivos Gerados Automaticamente

Quando você rodar o serviço, serão criados:

```
whisper-service/
├── .env                    # Suas configurações (copiar de .env.example)
├── venv/                   # Ambiente virtual Python
├── models/                 # Cache dos modelos Whisper
│   └── faster-whisper-base/
└── __pycache__/           # Cache Python
```

**Nota:** Estes arquivos estão no `.gitignore` e não devem ser commitados.

---

## 🎓 Ordem de Leitura Recomendada

### Para Implementação Rápida (30 min)
1. [QUICKSTART.md](QUICKSTART.md) - 15 min
2. [FRONTEND_INTEGRATION.md](FRONTEND_INTEGRATION.md) - 15 min

### Para Entendimento Completo (2 horas)
1. [README.md](README.md) - 30 min
2. [DEPLOY.md](DEPLOY.md) - 45 min
3. [FRONTEND_INTEGRATION.md](FRONTEND_INTEGRATION.md) - 30 min
4. Explorar exemplos - 15 min

### Para Desenvolvimento (1 semana)
1. Ler toda documentação
2. Testar todos os exemplos
3. Customizar para seu caso de uso
4. Implementar melhorias

---

**Desenvolvido para CinthiaMed** 🏥

Todas as peças estão prontas para você implementar um sistema de voz médico completo! 🚀
