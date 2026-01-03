# ✅ Checklist de Verificação de Estrutura

Execute este checklist antes de cada deploy para garantir que a estrutura está correta:

## 1. Verificar quantidade de arquivos em `api/`

```bash
find api -name "*.js" -type f | wc -l
```

**Resultado esperado:** `1` (apenas api/index.js)

---

## 2. Verificar arquivos auxiliares em `src/server/`

```bash
find src/server -name "*.js" -type f | wc -l
```

**Resultado esperado:** `13` arquivos

---

## 3. Listar arquivos em `api/`

```bash
ls -la api/
```

**Resultado esperado:**
```
api/
├── index.js
└── package.json
```

---

## 4. Verificar imports em `api/index.js`

```bash
grep "from.*src/server" api/index.js | head -5
```

**Resultado esperado:** Todos os imports devem apontar para `../src/server/`:
```javascript
import { sendVerificationEmail } from '../src/server/services/emailService.js';
import { createMedicalAgentWorkflow } from '../src/server/graph/workflow.js';
```

---

## 5. Verificar .vercelignore

```bash
cat .vercelignore
```

**Resultado esperado:** NÃO deve conter `src/` ou `src/server/` na lista de ignores.

Deve ter comentário:
```
# Keep src/server/ - needed by api/index.js
# Do NOT ignore src/server/
```

---

## 6. Verificar vercel.json

```bash
cat vercel.json
```

**Resultado esperado:**
```json
{
  "functions": {
    "api/index.js": {
      "memory": 3008,
      "maxDuration": 60
    }
  }
}
```

---

## 7. Verificar dependências em `api/package.json`

```bash
cat api/package.json | grep -A 15 dependencies
```

**Resultado esperado:** Deve conter LangGraph:
```json
"@langchain/core": "^1.1.8",
"@langchain/langgraph": "^1.0.7",
"@langchain/openai": "^1.2.0"
```

---

## ✅ Se todos os checks passarem:

A estrutura está correta e o deploy deve funcionar com **apenas 1 função serverless**.

---

## 🔍 Debug: Se o deploy ainda falhar

### Verificar logs do Vercel:

1. Acesse: https://vercel.com/dashboard
2. Clique no projeto CinthiaMed
3. Clique no último deployment
4. Veja a aba "Building" ou "Logs"
5. Procure por:
   - "No more than 12 Serverless Functions" → Estrutura ainda errada
   - "Module not found" → Problema de imports
   - "Cannot find package" → Falta dependência em api/package.json

### Forçar re-build limpo:

Se a Vercel estiver usando cache antigo:

```bash
# Adicionar linha no vercel.json para forçar rebuild
{
  "cleanUrls": true,  # Adicionar esta linha
  "functions": { ... }
}
```

Ou deletar o projeto na Vercel e fazer novo deploy from scratch.

---

**Última verificação:** 2026-01-03
