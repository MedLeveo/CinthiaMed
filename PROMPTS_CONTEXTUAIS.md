# 🧠 Sistema de Prompts Contextuais - CinthiaMed

**Data**: 2025-12-31
**Versão**: 2.0

## 📋 Visão Geral

Sistema avançado de prompts que adapta o comportamento da IA baseado na aba/contexto selecionado pelo usuário no menu lateral. Cada ferramenta tem um prompt especializado que garante respostas precisas e seguras.

---

## 🎯 Arquitetura

### Fluxo de Contexto Dinâmico

```
Usuário clica em aba do menu
       ↓
Frontend detecta mudança de contexto
       ↓
Limpa chat anterior (salva em histórico)
       ↓
Carrega system prompt específico
       ↓
Envia para API com systemMessage
       ↓
IA responde no modo correto
```

---

## 📚 Contextos Disponíveis

### 1. Chat Geral (`chat`)
**Ação do Menu**: "Nova Conversa"

**Comportamento**:
- Assistente de diagnóstico diferencial
- Visão holística do caso clínico
- Sugere exames complementares
- Redireciona para ferramentas específicas quando apropriado

**Prompt Inclui**:
- Identity & Role da CinthiaMed
- Prime Directives (segurança, zero hallucination, LGPD)
- Instruções para sugerir ferramentas dedicadas

---

### 2. Gravar Consulta (`recording`)
**Ação do Menu**: "Gravar Consulta Online"

**Comportamento**: Escriba Médico Inteligente
- Transforma áudio/texto em prontuário formal
- Formato **S.O.A.P.** obrigatório
- Destaca **Red Flags** e alergias
- Ignora vícios de linguagem

**Formato de Saída**:
```markdown
## SUBJETIVO (S)
[Queixa principal, HDA, HPP, hábitos]

## OBJETIVO (O)
[Sinais vitais, exame físico]

## AVALIAÇÃO (A)
[Hipóteses diagnósticas]

## PLANO (P)
[Exames, tratamento, orientações]

**Red Flags Identificados:** [Lista]
```

---

### 3. Doses Pediátricas (`pediatric`)
**Ação do Menu**: "Doses Pediátricas"

**Comportamento**: Calculadora Pediátrica de Alta Criticidade
- **EXIGE peso** - nunca calcula só pela idade
- Chain of Thought visível (mostra todos os cálculos)
- Verifica dose teto (máximo de adulto)
- Alerta visual se ultrapassar dose segura

**Exemplo de Resposta**:
```markdown
### Medicamento: Paracetamol
- **Peso:** 15 kg
- **Dose prescrita:** 15 mg/kg/dose
- **Cálculo:** 15 kg × 15 mg/kg = **225 mg por dose**
- **Concentração:** 100 mg/mL
- **Volume a aspirar:** 225 mg ÷ 100 mg/mL = **2.25 mL por dose**
- **Frequência:** A cada 6 horas (4 vezes/dia)
- **Dose diária total:** 225 mg × 4 = **900 mg/dia**

⚠️ *Valide os dados e a conduta clínica antes de aplicar.*
```

**Verificação de Segurança**:
```
⚠️ ALERTA DE SEGURANÇA: DOSE TETO ATINGIDA
A dose calculada (4500 mg) excede a dose máxima de adulto (4000 mg).
Utilize a dose teto: 4000 mg
```

---

### 4. Escores Clínicos (`scores`)
**Ação do Menu**: "Escores Clínicos"

**Comportamento**: Calculadora de Risco e Prognóstico
- Lista critérios necessários se faltarem dados
- Nunca assume valores
- Mostra pontuação total + interpretação
- Sugere conduta baseada em guidelines

**Escores Suportados**:
- Glasgow, CURB-65, TIMI, Wells
- CHA2DS2-VASc, HAS-BLED
- APACHE, SOFA, qSOFA
- E muitos outros...

**Exemplo de Resposta**:
```markdown
### Escore: CURB-65
**Critérios Pontuados:**
- Confusão: 1 ponto
- Ureia > 50 mg/dL: 1 ponto
- FR ≥ 30: 0 pontos
- PAS < 90 ou PAD ≤ 60: 0 pontos
- Idade ≥ 65: 1 ponto

**Pontuação Total: 3 pontos**

**Interpretação:**
Alto risco de mortalidade (CURB-65 ≥ 3)

**Conduta Sugerida:**
- Considerar internação hospitalar urgente
- Possível necessidade de UTI
- Antibioticoterapia EV de amplo espectro

⚠️ *Valide os dados e a conduta clínica antes de aplicar.*
```

---

### 5. Calculadora Médica (`calculator`)
**Ação do Menu**: "Calculadora Médica"

**Comportamento**: Fórmulas Fisiológicas e Conversões
- Clearance de Creatinina (CKD-EPI, Cockcroft-Gault)
- IMC, Superfície Corpórea
- Reposição Eletrolítica
- Taxas de Infusão (Drogas Vasoativas)
- Correção de Sódio, Osmolaridade, Anion Gap

**Exemplo de Resposta**:
```markdown
### Cálculo: Clearance de Creatinina (CKD-EPI 2021)
**Variáveis Fornecidas:**
- Creatinina sérica: 1.2 mg/dL
- Idade: 65 anos
- Sexo: Feminino
- Raça: Não-negra

**Fórmula:**
ClCr = 142 × min(Scr/κ, 1)^α × max(Scr/κ, 1)^(-1.200) × 0.9938^Idade × 1.012 [se feminino]

**Resultado: 52 mL/min/1.73m²**

**Interpretação:**
DRC Estágio 3a (TFG 45-59 mL/min)
Ajuste de dose de medicações necessário.

⚠️ *Valide os dados e a conduta clínica antes de aplicar.*
```

---

## 🔒 Prime Directives (Todas as Abas)

### 1. Segurança em Primeiro Lugar
- Se dados vitais faltarem (ex: peso em pediatria), **EXIGE antes de calcular**
- Nunca assume valores ou faz aproximações perigosas

### 2. Zero Hallucination
- Se não souber, diz: "Não tenho informações suficientes para responder com segurança"
- Nunca inventa doses ou protocolos

### 3. Proteção de Dados (LGPD)
- Detecta dados nominativos (CPF, Nome completo, Telefone)
- Alerta o médico para anonimizar
- Não repete dados sensíveis na resposta

### 4. Disclaimer Obrigatório
- Todas respostas com cálculos ou condutas terminam com:
  **"⚠️ Valide os dados e a conduta clínica antes de aplicar."**

---

## 🎨 Tom e Estilo (Padronizado)

### Profissional
- Terminologia médica correta
- "Emese" em vez de "Vômito"
- "Cefaleia" em vez de "Dor de cabeça"

### Conciso
- Médicos têm pouco tempo
- Bullet points e negrito para doses
- Direto ao ponto

### Neutro
- Sem julgamentos sobre paciente ou médico
- Foco técnico e objetivo

---

## 🚫 Recusa de Tarefas

Se usuário pedir algo não-médico:
```
"Como assistente CinthiaMed, meu escopo é restrito ao suporte médico e clínico.
Não posso auxiliar com este tópico."
```

---

## 💻 Implementação Técnica

### Frontend (`src/CinthiaMed.js`)

**Estado de Contexto**:
```javascript
const [currentContext, setCurrentContext] = useState('chat');
```

**Troca de Contexto ao Clicar no Menu**:
```javascript
const handleMenuClick = (action) => {
  const newContext = MENU_TO_CONTEXT[action] || 'chat';

  // Se mudou de contexto
  if (newContext !== currentContext) {
    saveCurrentConversation(); // Salva conversa atual
    setMessages([]);            // Limpa chat
    setCurrentConversationId(null); // Nova sessão
  }

  setCurrentContext(newContext);
};
```

**Envio com System Prompt**:
```javascript
const systemMessage = getSystemPrompt(currentContext);

fetch('/api/chat', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    message: userMessage,
    systemMessage: systemMessage, // ✅ Prompt contextual
    conversationId: currentConversationId
  })
});
```

### Backend (`api/index.js`)

**Aceita System Message Dinâmico**:
```javascript
app.post('/api/chat', authMiddleware, async (req, res) => {
  const { message, systemMessage } = req.body;

  const defaultSystemMessage = 'Você é a CinthiaMed...';
  const activeSystemMessage = systemMessage || defaultSystemMessage;

  const messages = [
    { role: 'system', content: activeSystemMessage }, // ✅ Usa prompt dinâmico
    ...conversationHistory,
    { role: 'user', content: message }
  ];

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: messages,
    max_tokens: 3000 // ✅ Aumentado para respostas detalhadas
  });
});
```

### Configuração (`src/config/systemPrompts.js`)

**Mapeamento Menu → Contexto**:
```javascript
export const MENU_TO_CONTEXT = {
  'new': 'chat',
  'recording': 'recording',
  'pediatric': 'pediatric',
  'scores': 'scores',
  'calculator': 'calculator'
};
```

**Obter Prompt por Contexto**:
```javascript
export const getSystemPrompt = (context = 'chat') => {
  return CONTEXT_PROMPTS[context] || CONTEXT_PROMPTS['chat'];
};
```

---

## 🧪 Testes

### Teste 1: Troca de Contexto
1. Abrir "Nova Conversa" → Perguntar sobre sintomas
2. Clicar em "Doses Pediátricas" → Chat deve limpar
3. Pedir dose de dipirona SEM dar peso → IA deve exigir peso

### Teste 2: Segurança Pediátrica
```
Usuário: "Dose de dipirona para criança de 5 anos"
IA: "Para calcular a dose com segurança, preciso do peso da criança. Qual é o peso?"
```

### Teste 3: Gravar Consulta
```
Usuário: [Envia transcrição bagunçada]
IA: [Retorna formato S.O.A.P. limpo com Red Flags destacados]
```

### Teste 4: Escores Clínicos
```
Usuário: "Calcula o CURB-65"
IA: "Para calcular o CURB-65, preciso dos seguintes dados:
     - Confusão mental? (Sim/Não)
     - Ureia sérica (mg/dL)
     - Frequência respiratória (irpm)
     - Pressão arterial sistólica e diastólica (mmHg)
     - Idade (anos)"
```

---

## 📊 Comparação: Antes vs Depois

| Aspecto | Antes | Depois |
|---------|-------|--------|
| **Prompt** | Fixo para todas abas | Dinâmico por contexto |
| **Segurança Pediátrica** | Genérica | Alta criticidade, exige peso |
| **Troca de Aba** | Misturava contextos | Limpa e inicia nova sessão |
| **Formatos** | Texto livre | S.O.A.P., Chain of Thought |
| **Dose Teto** | Não verificava | Alerta visual automático |
| **LGPD** | Não alertava | Detecta e alerta dados sensíveis |
| **Escores** | Fazia suposições | Exige todos critérios |

---

## 🚀 Benefícios

1. **Precisão Cirúrgica**: Cada ferramenta tem comportamento otimizado
2. **Segurança Máxima**: Prompts com regras de segurança específicas
3. **UX Limpa**: Troca de contexto não mistura conversas antigas
4. **Compliance**: LGPD integrado em todos prompts
5. **Zero Confusion**: IA sabe exatamente qual papel desempenhar

---

## 📝 Arquivos Modificados

1. ✅ `src/config/systemPrompts.js` - Prompts contextuais (NOVO)
2. ✅ `src/CinthiaMed.js` - Lógica de troca de contexto
3. ✅ `api/index.js` - Suporte a systemMessage dinâmico
4. ✅ `PROMPTS_CONTEXTUAIS.md` - Esta documentação (NOVO)

---

**Desenvolvido por**: Claude Code + Maycon Andre
**Versão**: 2.0.0
**Status**: ✅ Implementado e Pronto para Deploy
