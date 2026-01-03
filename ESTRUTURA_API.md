# 📁 Nova Estrutura da API - Otimizada para Vercel

## ⚠️ Problema Resolvido

**Erro anterior:**
```
Error: No more than 12 Serverless Functions can be added to a Deployment
on the Hobby plan.
```

**Causa:** A Vercel detectava automaticamente todos os arquivos `.js` na pasta `api/` como funções serverless separadas (14 arquivos = 14 funções).

**Solução:** Mover arquivos auxiliares para fora de `api/`, deixando apenas o endpoint principal.

---

## 📂 Estrutura Atual

```
cinthiamed/
├── api/                          # Apenas funções serverless Vercel
│   ├── index.js                  # ✅ ÚNICO endpoint (1 serverless function)
│   └── package.json              # Dependências do serverless
│
├── src/server/                      # Código auxiliar (NÃO são serverless functions)
│   ├── config/
│   │   ├── emailTemplates.js     # Templates de email
│   │   └── EMAIL_CONFIG.md       # Documentação de email
│   │
│   ├── graph/                    # LangGraph workflow
│   │   ├── state.js              # Definição do estado
│   │   ├── nodes.js              # Nós do workflow
│   │   ├── workflow.js           # Orquestração
│   │   └── enhancedSafetyChecker.js  # Validador de segurança
│   │
│   ├── services/                 # Serviços externos
│   │   ├── emailService.js       # Envio de emails
│   │   ├── scientificSearch.js   # Busca científica
│   │   ├── semanticScholarService.js
│   │   ├── europePmcService.js
│   │   ├── clinicalTrialsService.js
│   │   ├── openFdaService.js
│   │   └── lilacsService.js
│   │
│   └── utils/                    # Utilitários
│       └── queryNormalizer.js    # Normalização de queries
│
├── public/                       # Assets estáticos
├── build/                        # Build de produção
└── ...
```

---

## 🔧 Como Funciona

### **Antes (❌ 14 funções serverless):**
```
api/
├── index.js              → Função 1
├── config/
│   └── emailTemplates.js → Função 2
├── graph/
│   ├── state.js          → Função 3
│   ├── nodes.js          → Função 4
│   ├── workflow.js       → Função 5
│   └── enhancedSafetyChecker.js → Função 6
├── services/
│   ├── emailService.js   → Função 7
│   ├── ...               → Funções 8-13
└── utils/
    └── queryNormalizer.js → Função 14

Total: 14 funções > Limite de 12 (Hobby plan) ❌
```

### **Agora (✅ 1 função serverless):**
```
api/
└── index.js              → Função 1 ✅

src/server/
└── (todos os arquivos auxiliares - NÃO são funções serverless)

Total: 1 função < Limite de 12 ✅
```

---

## 📝 Mudanças nos Imports

**Antes:**
```javascript
// api/index.js
import { sendVerificationEmail } from './services/emailService.js';
import { createMedicalAgentWorkflow } from './graph/workflow.js';
```

**Agora:**
```javascript
// api/index.js
import { sendVerificationEmail } from '../src/server/services/emailService.js';
import { createMedicalAgentWorkflow } from '../src/server/graph/workflow.js';
```

---

## ✅ Validação

### **1. Verificar quantidade de funções serverless:**
```bash
find api -name "*.js" -type f | wc -l
# Deve retornar: 1
```

### **2. Build de produção:**
```bash
npm run build
# Deve compilar sem erros
```

### **3. Deploy Vercel:**
```bash
git push origin main
# Vercel deve fazer deploy automático com sucesso
```

---

## 🚀 Deploy na Vercel

### **Configuração (`vercel.json`):**
```json
{
  "functions": {
    "api/index.js": {
      "memory": 3008,
      "maxDuration": 60
    }
  },
  "rewrites": [
    { "source": "/api/:path*", "destination": "/api" },
    { "source": "/:path*", "destination": "/index.html" }
  ]
}
```

**Explicação:**
- `functions`: Define configuração específica para `api/index.js`
- `memory`: 3GB RAM (para processar LangGraph + LLM calls)
- `maxDuration`: 60s timeout (para buscas científicas + síntese)
- `rewrites`: Redireciona todas as rotas `/api/*` para `api/index.js`

---

## ⚠️ IMPORTANTE: Não Criar Novos Arquivos em `api/`

**Regra:**
- ✅ Criar arquivos auxiliares em `src/server/`
- ❌ **NUNCA** criar novos `.js` em `api/` (exceto `index.js`)

**Motivo:**
Cada arquivo `.js` em `api/` = 1 função serverless na Vercel

**Exemplo Correto:**
```bash
# ✅ Criar novo serviço
touch src/server/services/newService.js

# ❌ NÃO FAZER
touch api/newService.js  # Isso criaria uma 2ª função serverless!
```

---

## 🔄 Fluxo de Requisição

```
Cliente
  ↓
Vercel Edge Network
  ↓
/api/* → api/index.js (Serverless Function)
            ↓
         Importa módulos de src/server/
            ↓ ↓ ↓
      graph/  services/  utils/
            ↓
      Processa requisição
            ↓
      Retorna resposta
```

**Tudo roda em 1 única função serverless**, importando módulos de `src/server/` conforme necessário.

---

## 📊 Benefícios da Nova Estrutura

1. ✅ **Deploy funcionando:** 1 função serverless < Limite de 12
2. ✅ **Código organizado:** Separação clara entre endpoint e lógica
3. ✅ **Mesma funcionalidade:** Nenhuma feature foi removida
4. ✅ **Cold start mais rápido:** Apenas 1 função para inicializar
5. ✅ **Manutenção fácil:** Estrutura clara e documentada

---

## 🧪 Testes Pós-Deploy

Após o deploy, testar:

1. **Login/Registro:**
   ```bash
   POST /api/register
   POST /api/login
   ```

2. **Chat Médico:**
   ```bash
   POST /api/chat
   ```

3. **LangGraph Workflow:**
   - Pergunta sobre dengue (deve priorizar LILACS)
   - Pergunta com medicamento (deve buscar OpenFDA)
   - Verificação de segurança (4 critérios)

---

**Última atualização:** 2025-01-03 (Commit: 240f251)
