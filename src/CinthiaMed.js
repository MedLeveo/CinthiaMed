import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeSanitize from 'rehype-sanitize';
import 'katex/dist/katex.min.css';
import './styles/responsive.css';
import API_URL from './config/api';
import { getSystemPrompt, MENU_TO_CONTEXT } from './config/systemPrompts';
import ExamReader from './components/ExamReader';
import SOAPViewer from './components/SOAPViewer';
import { formatToSOAP, generateSOAPLocal } from './utils/soapFormatter';

import ScoreCalculator from './components/ScoreCalculator';

const CinthiaMed = ({ user, onLogout }) => {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [selectedAssistant, setSelectedAssistant] = useState('Assistente Geral');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [currentView, setCurrentView] = useState('chat'); // 'chat', 'recording' ou 'exam-reader'
  const [activeMenuAction, setActiveMenuAction] = useState('new'); // Para rastrear qual botão do menu está ativo
  const [currentContext, setCurrentContext] = useState('chat'); // Contexto atual para system prompt
  const [isThinking, setIsThinking] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);

  // Novos estados para funcionalidades
  const [currentSOAP, setCurrentSOAP] = useState(null);
  const [showSOAPViewer, setShowSOAPViewer] = useState(false);


  // Sistema de conversas
  const [conversations, setConversations] = useState([]);
  const [currentConversationId, setCurrentConversationId] = useState(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Estado para verificar se é a primeira visita
  const [isReturningUser, setIsReturningUser] = useState(false);
  // Estado para controlar se deve mostrar a mensagem de boas-vindas
  const [showWelcomeMessage, setShowWelcomeMessage] = useState(false);



  // Estado para armazenar feedbacks das mensagens
  const [messageFeedbacks, setMessageFeedbacks] = useState({});

  // Detect screen resize for responsive behavior
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (!mobile) {
        setShowMobileSidebar(false); // Close mobile sidebar when switching to desktop
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Load conversations from localStorage on mount
  useEffect(() => {
    const savedConversations = localStorage.getItem(`conversations_${user.email}`);
    const hasSeenWelcome = localStorage.getItem(`hasSeenWelcome_${user.email}`);

    if (savedConversations) {
      try {
        const parsed = JSON.parse(savedConversations);
        // Convert date strings back to Date objects
        const conversationsWithDates = parsed.map(conv => ({
          ...conv,
          createdAt: conv.createdAt ? new Date(conv.createdAt) : new Date(),
          lastUpdated: conv.lastUpdated ? new Date(conv.lastUpdated) : new Date()
        }));
        setConversations(conversationsWithDates);
        // Se tem conversas salvas, é um usuário que já usou o app
        setIsReturningUser(true);
      } catch (error) {
        console.error('Error loading conversations:', error);
      }
    }

    // Mostrar mensagem de boas-vindas apenas se nunca foi vista nesta sessão
    if (!hasSeenWelcome) {
      setShowWelcomeMessage(true);
      // Marcar que a mensagem foi vista
      localStorage.setItem(`hasSeenWelcome_${user.email}`, 'true');
    }
  }, [user.email]);

  // Save conversations to localStorage whenever they change
  useEffect(() => {
    if (conversations.length > 0) {
      localStorage.setItem(`conversations_${user.email}`, JSON.stringify(conversations));
      // Marcar como usuário recorrente após salvar a primeira conversa
      setIsReturningUser(true);
    }
  }, [conversations, user.email]);

  // Esconder mensagem de boas-vindas quando usuário começar a usar o app
  useEffect(() => {
    if (messages.length > 0) {
      setShowWelcomeMessage(false);
    }
  }, [messages.length]);

  // Estados para gravação de reunião
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [patientName, setPatientName] = useState('');
  const [patientAge, setPatientAge] = useState('');
  const [patientGender, setPatientGender] = useState('');
  const [clinicalObservations, setClinicalObservations] = useState('');
  const [audioBlob, setAudioBlob] = useState(null);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [clinicalReport, setClinicalReport] = useState('');
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [manualTranscript, setManualTranscript] = useState(''); // Transcrição manual

  // Estados para calculadora médica
  const [selectedCalculator, setSelectedCalculator] = useState(null);
  const [calculatorInputs, setCalculatorInputs] = useState({});
  const [calculatorResult, setCalculatorResult] = useState(null);

  // Estados para escores clínicos
  const [selectedScore, setSelectedScore] = useState(null);
  const [scoreInputs, setScoreInputs] = useState({});
  const [scoreResult, setScoreResult] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');

  // Catálogo de escores com categorias
  const clinicalScores = [
    { name: 'PECARN TCE', category: 'Neurologia', description: 'Trauma craniano pediátrico' },
    { name: 'Ânion Gap', category: 'Calculadoras Gerais', description: 'Distúrbios ácido-base' },
    { name: 'Idade Gestacional', category: 'Calculadoras Gerais', description: 'Cálculo de idade gestacional' },
    { name: 'IMC e ASC', category: 'Calculadoras Gerais', description: 'Índice de massa corporal e área de superfície' },
    { name: 'QTc', category: 'Cardiologia', description: 'Intervalo QT corrigido' },
    { name: 'Osmolalidade', category: 'Calculadoras Gerais', description: 'Osmolalidade sérica' },
    { name: 'CIWA-Ar', category: 'Psiquiatria', description: 'Abstinência alcoólica' },
    { name: 'Correção de Cálcio', category: 'Calculadoras Gerais', description: 'Cálcio corrigido por albumina' },
    { name: 'Correção de Sódio', category: 'Calculadoras Gerais', description: 'Sódio corrigido por glicose' },
    { name: 'Framingham', category: 'Cardiologia', description: 'Risco cardiovascular' },
    { name: 'Hestia', category: 'Pneumologia', description: 'Segurança de tratamento ambulatorial TEP' },
    { name: 'Sgarbossa', category: 'Cardiologia', description: 'IAM com BRE' },
    { name: 'Wells TEP', category: 'Pneumologia', description: 'Probabilidade de tromboembolismo pulmonar' },
    { name: 'Wells TVP', category: 'Emergência', description: 'Probabilidade de trombose venosa profunda' },
    { name: 'Déficit Água Livre', category: 'Calculadoras Gerais', description: 'Déficit de água livre' },
    { name: 'Depuração Creatinina', category: 'Calculadoras Gerais', description: 'Clearance de creatinina' },
    { name: 'MDRD', category: 'Calculadoras Gerais', description: 'Taxa de filtração glomerular' },
    { name: 'RASS', category: 'UTI', description: 'Escala de sedação' },
    { name: 'NIHSS', category: 'Neurologia', description: 'Escala de AVC' },
    { name: 'Glasgow', category: 'Neurologia', description: 'Escala de coma de Glasgow' },
    { name: '2HELPS2B', category: 'Neurologia', description: 'Risco de convulsão pós-AVC' },
    { name: 'ABCD²', category: 'Neurologia', description: 'Risco de AVC após AIT' },
    { name: 'AIR', category: 'Gastroenterologia', description: 'Escore de apendicite' },
    { name: 'CHA₂DS₂-VASc', category: 'Cardiologia', description: 'Risco de AVC em fibrilação atrial' },
    { name: 'CURB-65', category: 'Pneumologia', description: 'Gravidade de pneumonia' },
    { name: 'Alvarado', category: 'Gastroenterologia', description: 'Escore de apendicite' },
    { name: 'EDACS', category: 'Cardiologia', description: 'Dor torácica aguda' },
    { name: 'Centor', category: 'Emergência', description: 'Faringite estreptocócica' },
    { name: 'Dissecção Aórtica', category: 'Cardiologia', description: 'Risco de dissecção aórtica' },
    { name: 'Genebra', category: 'Pneumologia', description: 'Probabilidade de TEP' },
    { name: 'Risco Genebra TEV', category: 'Pneumologia', description: 'Risco de TEV' },
    { name: 'Síncope Canadense', category: 'Cardiologia', description: 'Risco em síncope' },
    { name: 'TIMI', category: 'Cardiologia', description: 'Risco em síndrome coronariana aguda' },
    { name: 'Rockall', category: 'Gastroenterologia', description: 'Hemorragia digestiva alta' },
    { name: 'Glasgow-Blatchford', category: 'Gastroenterologia', description: 'Hemorragia digestiva alta' },
    { name: 'FeverPAIN', category: 'Emergência', description: 'Faringite' },
    { name: 'HEART', category: 'Cardiologia', description: 'Dor torácica' },
    { name: 'MACOCHA', category: 'UTI', description: 'Falha de extubação' },
    { name: 'NEWS 2', category: 'UTI', description: 'Deterioração clínica' },
    { name: 'PSI/PORT', category: 'Pneumologia', description: 'Gravidade de pneumonia' },
    { name: 'qSOFA', category: 'UTI', description: 'Sepse' },
    { name: 'SOFA', category: 'UTI', description: 'Disfunção orgânica em sepse' },
    { name: 'MELD', category: 'Gastroenterologia', description: 'Prioridade para transplante hepático' },
    { name: 'Child-Pugh', category: 'Gastroenterologia', description: 'Classificação de cirrose hepática' },
    { name: 'GRACE', category: 'Cardiologia', description: 'Risco em síndrome coronariana aguda' },
    { name: 'Ranson', category: 'Gastroenterologia', description: 'Gravidade de pancreatite aguda' },
    { name: 'Índice de Choque', category: 'Emergência', description: 'Instabilidade hemodinâmica' },
    { name: 'PESI', category: 'Pneumologia', description: 'Mortalidade em TEP' },
    { name: 'Mortalidade Endarterectomia', category: 'Cardiologia', description: 'Risco cirúrgico' },
    { name: 'NEXUS Crânio', category: 'Neurologia', description: 'Necessidade de TC crânio' },
    { name: 'NEXUS Coluna', category: 'Emergência', description: 'Necessidade de imagem de coluna' },
    { name: 'NEXUS Tórax', category: 'Emergência', description: 'Necessidade de RX tórax' },
    { name: 'Peso Corporal Ideal', category: 'Calculadoras Gerais', description: 'Peso corporal ideal' },
    { name: 'PAM', category: 'Calculadoras Gerais', description: 'Pressão arterial média' },
    { name: 'Regra Canadense TC', category: 'Neurologia', description: 'Necessidade de TC crânio' },
    { name: 'Ottawa HSA', category: 'Neurologia', description: 'Hemorragia subaracnoidea' },
    { name: 'PERC', category: 'Pneumologia', description: 'Exclusão de TEP' },
    { name: 'TFG CKD-EPI', category: 'Calculadoras Gerais', description: 'Taxa de filtração glomerular' },
    { name: '4AT', category: 'Neurologia', description: 'Triagem de delirium' },
    { name: '6MWT', category: 'Calculadoras Gerais', description: 'Teste de caminhada de 6 minutos' }
  ];

  // Função para normalizar texto (remover acentos e converter para minúsculas)
  const normalizeText = (text) => {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, ''); // Remove acentos
  };

  // Filtrar escores por busca e categoria
  const filteredScores = clinicalScores.filter(score => {
    if (!searchTerm.trim()) {
      // Se não há busca, apenas filtra por categoria
      const matchesCategory = selectedCategory === 'Todos' || score.category === selectedCategory;
      return matchesCategory;
    }

    const searchNormalized = normalizeText(searchTerm);
    const nameNormalized = normalizeText(score.name);
    const descriptionNormalized = normalizeText(score.description);
    const categoryNormalized = normalizeText(score.category);

    // Busca em nome, descrição E categoria
    const matchesSearch = nameNormalized.includes(searchNormalized) ||
      descriptionNormalized.includes(searchNormalized) ||
      categoryNormalized.includes(searchNormalized);

    const matchesCategory = selectedCategory === 'Todos' || score.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  // Ref to track previous assistant
  const prevAssistantRef = useRef(selectedAssistant);

  // Função para mostrar toast
  const showToastMessage = (message) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  // Função para salvar conversa atual
  const saveCurrentConversation = () => {
    if (messages.length > 0 && currentConversationId) {
      setConversations(prev => {
        const existing = prev.find(c => c.id === currentConversationId);
        if (existing) {
          return prev.map(c =>
            c.id === currentConversationId
              ? { ...c, messages, lastUpdated: new Date() }
              : c
          );
        } else {
          const firstUserMessage = messages.find(m => m.type === 'user');
          return [...prev, {
            id: currentConversationId,
            title: firstUserMessage?.content.substring(0, 50) || 'Nova conversa',
            messages,
            isFavorite: false,
            createdAt: new Date(),
            lastUpdated: new Date()
          }];
        }
      });
    }
  };

  // Função para criar nova conversa
  const createNewConversation = () => {
    saveCurrentConversation();
    setMessages([]);
    setCurrentConversationId(`conv_${Date.now()}`);
    setSelectedAssistant('Assistente Geral'); // Reset to default assistant
  };

  // Função para carregar conversa
  const loadConversation = (conversationId) => {
    saveCurrentConversation();
    const conversation = conversations.find(c => c.id === conversationId);
    if (conversation) {
      setMessages(conversation.messages || []);
      setCurrentConversationId(conversationId);
      setCurrentView('chat');
    } else {
      // Se a conversa não existe, criar uma nova
      setMessages([]);
      setCurrentConversationId(`conv_${Date.now()}`);
      setCurrentView('chat');
    }
  };

  // Função para favoritar/desfavoritar
  const toggleFavorite = () => {
    if (!currentConversationId || messages.length === 0) return;

    saveCurrentConversation();

    setConversations(prev => prev.map(c => {
      if (c.id === currentConversationId) {
        const newFavoriteStatus = !c.isFavorite;
        showToastMessage(newFavoriteStatus ? 'Conversa favoritada com sucesso!' : 'Conversa removida dos favoritos');
        return { ...c, isFavorite: newFavoriteStatus };
      }
      return c;
    }));
  };

  // Verificar se conversa atual está favoritada
  const isCurrentConversationFavorite = () => {
    const conv = conversations.find(c => c.id === currentConversationId);
    return conv?.isFavorite || false;
  };

  // Função para registrar feedback da mensagem
  const handleMessageFeedback = (messageIndex, isPositive) => {
    setMessageFeedbacks(prev => ({
      ...prev,
      [messageIndex]: isPositive ? 'positive' : 'negative'
    }));

    // Salvar feedback no localStorage para persistência
    const feedbackData = {
      messageIndex,
      feedback: isPositive ? 'positive' : 'negative',
      timestamp: new Date().toISOString(),
      messageContent: messages[messageIndex]?.content.substring(0, 100),
      context: selectedAssistant
    };

    const savedFeedbacks = JSON.parse(localStorage.getItem('messageFeedbacks') || '[]');
    savedFeedbacks.push(feedbackData);
    localStorage.setItem('messageFeedbacks', JSON.stringify(savedFeedbacks.slice(-100))); // Mantém últimos 100

    showToastMessage(isPositive ? 'Obrigado pelo feedback!' : 'Vamos melhorar!');
  };

  // Função para formatar data e hora
  const formatDateTime = (date) => {
    // Se já for uma string, retorna direto
    if (typeof date === 'string') {
      return date;
    }

    // Se for um objeto Date, formata
    if (date instanceof Date) {
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${day}/${month}/${year}, ${hours}:${minutes}`;
    }

    return '';
  };

  // Função para simular streaming (efeito de digitação)
  const streamText = async (fullText, messageIndex, sources, suggestedTools = []) => {
    const words = fullText.split(' ');
    let currentText = '';

    for (let i = 0; i < words.length; i++) {
      currentText += (i > 0 ? ' ' : '') + words[i];

      setMessages(prev => {
        const newMessages = [...prev];
        newMessages[messageIndex] = {
          ...newMessages[messageIndex],
          content: currentText,
          isStreaming: i < words.length - 1
        };
        return newMessages;
      });

      // Delay entre palavras (ajuste para velocidade)
      await new Promise(resolve => setTimeout(resolve, 30));
    }

    // Adicionar fontes e ferramentas sugeridas após completar o streaming
    setMessages(prev => {
      const newMessages = [...prev];
      newMessages[messageIndex] = {
        ...newMessages[messageIndex],
        sources: sources || [],
        suggestedTools: suggestedTools || [],
        isStreaming: false
      };
      return newMessages;
    });
  };

  // Função para processar texto inline (bold, italic, etc)
  const processInlineFormatting = (text) => {
    const parts = [];
    let currentText = text;
    let key = 0;

    // Processar **bold**
    const boldRegex = /\*\*(.+?)\*\*/g;
    let lastIndex = 0;
    let match;

    while ((match = boldRegex.exec(currentText)) !== null) {
      // Adicionar texto antes do bold
      if (match.index > lastIndex) {
        parts.push(
          <span key={key++}>{currentText.substring(lastIndex, match.index)}</span>
        );
      }
      // Adicionar texto em bold
      parts.push(
        <strong key={key++} style={{ fontWeight: '600', color: '#e2e8f0' }}>
          {match[1]}
        </strong>
      );
      lastIndex = match.index + match[0].length;
    }

    // Adicionar texto restante
    if (lastIndex < currentText.length) {
      parts.push(<span key={key++}>{currentText.substring(lastIndex)}</span>);
    }

    return parts.length > 0 ? parts : text;
  };

  // Função para formatar resposta da IA com estrutura
  const formatAIResponse = (text) => {
    if (!text) return null;

    const lines = text.split('\n');
    const elements = [];
    let currentParagraph = [];
    let listItems = [];
    let key = 0;

    const flushParagraph = () => {
      if (currentParagraph.length > 0) {
        elements.push(
          <p key={key++} style={{ marginBottom: '12px', lineHeight: '1.6' }}>
            {processInlineFormatting(currentParagraph.join(' '))}
          </p>
        );
        currentParagraph = [];
      }
    };

    const flushList = () => {
      if (listItems.length > 0) {
        elements.push(
          <ul key={key++} style={{
            marginBottom: '16px',
            paddingLeft: '20px',
            listStyle: 'none',
          }}>
            {listItems.map((item, i) => (
              <li key={i} style={{
                marginBottom: '8px',
                paddingLeft: '8px',
                position: 'relative',
                lineHeight: '1.6',
              }}>
                <span style={{
                  position: 'absolute',
                  left: '-12px',
                  color: '#8b5cf6',
                }}>•</span>
                {processInlineFormatting(item)}
              </li>
            ))}
          </ul>
        );
        listItems = [];
      }
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      if (!line) {
        flushParagraph();
        flushList();
        continue;
      }

      // Detectar títulos com ### ou ##
      if (line.startsWith('###')) {
        flushParagraph();
        flushList();
        elements.push(
          <h4 key={key++} style={{
            fontSize: '16px',
            fontWeight: '600',
            color: '#a78bfa',
            marginBottom: '12px',
            marginTop: elements.length > 0 ? '20px' : '0',
          }}>
            {line.replace(/^###\s*/, '')}
          </h4>
        );
      } else if (line.startsWith('##')) {
        flushParagraph();
        flushList();
        elements.push(
          <h3 key={key++} style={{
            fontSize: '18px',
            fontWeight: '600',
            color: '#a78bfa',
            marginBottom: '12px',
            marginTop: elements.length > 0 ? '24px' : '0',
          }}>
            {line.replace(/^##\s*/, '')}
          </h3>
        );
      }
      // Detectar listas com - ou números
      else if (line.match(/^[-\*•]\s+/) || line.match(/^\d+\.\s+/)) {
        flushParagraph();
        const itemText = line.replace(/^[-\*•]\s+/, '').replace(/^\d+\.\s+/, '');
        listItems.push(itemText);
      }
      // Linha normal
      else {
        flushList();
        currentParagraph.push(line);
      }
    }

    flushParagraph();
    flushList();

    return elements.length > 0 ? elements : text;
  };

  const menuItems = [
    { icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" /></svg>, label: 'Nova conversa', action: 'new' },
    { icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="3" /><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" /></svg>, label: 'Gravar Consulta Online', action: 'recording' },
    { icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="12" y1="18" x2="12" y2="12" /><line x1="9" y1="15" x2="15" y2="15" /></svg>, label: 'Analisar Exame', action: 'exam-reader' },
    { icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="8" r="4" /><path d="M6 20v-2a4 4 0 014-4h4a4 4 0 014 4v2" /><circle cx="12" cy="8" r="2" /></svg>, label: 'Doses Pediátricas', action: 'pediatric' },
    { icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M9 21V9" /></svg>, label: 'Escores Clínicos', action: 'scores' },
    { icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="4" y="2" width="16" height="20" rx="2" /><path d="M8 6h8M8 10h8M8 14h4" /></svg>, label: 'Calculadora Médica', action: 'calculator' },
  ];

  // Banco de dados de calculadoras médicas
  const medicalCalculators = {
    categories: {
      'Nefrologia': ['nefro_ckd_epi_2021'],
      'Cardiologia': ['cardio_qtc_bazett', 'cardio_grace_score'],
      'Hepatologia': ['hepato_child_pugh'],
      'Pneumologia': ['pneumo_curb65'],
      'UTI/Trauma': ['uti_parkland', 'drug_vasopressor_infusion'],
      'Nutrição': ['med_anthropometry_bmi'],
      'Pediatria': ['ped_maintenance_fluids'],
      'Endocrinologia': ['endo_insulin_homa_ir'],
      'Hematologia': ['hemato_anc']
    },
    calculators: {
      'nefro_ckd_epi_2021': {
        name: 'CKD-EPI (2021) - Taxa de Filtração Glomerular',
        category: 'Nefrologia',
        inputs: [
          { name: 'creatinina_serica', label: 'Creatinina Sérica', unit: 'mg/dL', type: 'number' },
          { name: 'idade', label: 'Idade', unit: 'anos', type: 'number' },
          { name: 'sexo', label: 'Sexo', type: 'select', options: ['masculino', 'feminino'] }
        ],
        reference: 'Levey AS et al. NEJM, 2021',
        notes: ['Não utilizar em IRA', 'Não requer ajuste para raça (atualização 2021)']
      },
      'cardio_qtc_bazett': {
        name: 'QT Corrigido (Bazett)',
        category: 'Cardiologia',
        inputs: [
          { name: 'qt', label: 'Intervalo QT', unit: 'ms', type: 'number' },
          { name: 'fc', label: 'Frequência Cardíaca', unit: 'bpm', type: 'number' }
        ],
        reference: 'Bazett HC. Heart, 1920',
        notes: ['Superestima em FC > 100 bpm']
      },
      'cardio_grace_score': {
        name: 'Escore GRACE (SCA)',
        category: 'Cardiologia',
        inputs: [
          { name: 'idade', label: 'Idade', unit: 'anos', type: 'number' },
          { name: 'fc', label: 'FC', unit: 'bpm', type: 'number' },
          { name: 'pas', label: 'PAS', unit: 'mmHg', type: 'number' },
          { name: 'creat', label: 'Creatinina', unit: 'mg/dL', type: 'number' },
          { name: 'parada', label: 'Parada na admissão', type: 'select', options: ['Não', 'Sim'] },
          { name: 'st', label: 'Desvio ST', type: 'select', options: ['Não', 'Sim'] },
          { name: 'enzimas', label: 'Enzimas elevadas', type: 'select', options: ['Não', 'Sim'] },
          { name: 'killip', label: 'Killip', type: 'select', options: ['I', 'II', 'III', 'IV'] }
        ],
        reference: 'Eagle KA et al. JAMA, 2004',
        notes: ['Padrão ouro para estratificação em SCA']
      },
      'hepato_child_pugh': {
        name: 'Child-Pugh (Cirrose)',
        category: 'Hepatologia',
        inputs: [
          { name: 'bili', label: 'Bilirrubina Total', unit: 'mg/dL', type: 'number' },
          { name: 'albumina', label: 'Albumina', unit: 'g/dL', type: 'number' },
          { name: 'inr', label: 'INR', type: 'number' },
          { name: 'ascite', label: 'Ascite', type: 'select', options: ['Ausente', 'Leve', 'Moderada/Tensa'] },
          { name: 'encef', label: 'Encefalopatia', type: 'select', options: ['Ausente', 'Grau 1-2', 'Grau 3-4'] }
        ],
        reference: 'Child CG & Pugh RN, 1964/1973',
        notes: ['Classe C: sobrevida < 50% em 1 ano']
      },
      'pneumo_curb65': {
        name: 'CURB-65 (Pneumonia)',
        category: 'Pneumologia',
        inputs: [
          { name: 'confusao', label: 'Confusão Mental', type: 'select', options: ['Não', 'Sim'] },
          { name: 'ureia', label: 'Ureia > 42.8 mg/dL', type: 'select', options: ['Não', 'Sim'] },
          { name: 'fr', label: 'FR ≥ 30 irpm', type: 'select', options: ['Não', 'Sim'] },
          { name: 'pa', label: 'PAS < 90 ou PAD ≤ 60', type: 'select', options: ['Não', 'Sim'] },
          { name: 'idade', label: 'Idade ≥ 65 anos', type: 'select', options: ['Não', 'Sim'] }
        ],
        reference: 'Lim WS et al. Thorax, 2003',
        notes: ['0-1: ambulatorial', '2: considerar internação', '3-5: internação/UTI']
      },
      'uti_parkland': {
        name: 'Parkland (Queimados)',
        category: 'UTI/Trauma',
        inputs: [
          { name: 'peso', label: 'Peso', unit: 'kg', type: 'number' },
          { name: 'scq', label: 'SCQ', unit: '%', type: 'number' }
        ],
        reference: 'Baxter CR. Parkland Hospital',
        notes: ['50% nas 8h iniciais, 50% nas 16h seguintes']
      },
      'med_anthropometry_bmi': {
        name: 'IMC',
        category: 'Nutrição',
        inputs: [
          { name: 'peso', label: 'Peso', unit: 'kg', type: 'number' },
          { name: 'altura', label: 'Altura', unit: 'm', type: 'number' }
        ],
        reference: 'WHO',
        notes: ['Não distingue massa muscular', 'Inválido para gestantes']
      },
      'ped_maintenance_fluids': {
        name: 'Holliday-Segar (Hidratação Pediátrica)',
        category: 'Pediatria',
        inputs: [
          { name: 'peso', label: 'Peso', unit: 'kg', type: 'number' }
        ],
        reference: 'Holliday MA, Segar WE. Pediatrics, 1957',
        notes: ['100/50/20 mL/kg para 10/10/>20 kg']
      },
      'endo_insulin_homa_ir': {
        name: 'HOMA-IR',
        category: 'Endocrinologia',
        inputs: [
          { name: 'glicemia', label: 'Glicemia Jejum', unit: 'mg/dL', type: 'number' },
          { name: 'insulina', label: 'Insulina Jejum', unit: 'uUI/mL', type: 'number' }
        ],
        reference: 'Matthews DR et al. Diabetologia, 1985',
        notes: ['> 2.7: alta resistência insulínica']
      },
      'drug_vasopressor_infusion': {
        name: 'Infusão de Noradrenalina',
        category: 'UTI/Trauma',
        inputs: [
          { name: 'peso', label: 'Peso', unit: 'kg', type: 'number' },
          { name: 'dose', label: 'Dose', unit: 'mcg/kg/min', type: 'number' },
          { name: 'conc', label: 'Concentração', unit: 'mg/mL', type: 'number' }
        ],
        reference: 'Protocolo de UTI',
        notes: ['> 2 mcg/kg/min: dose refratária']
      },
      'hemato_anc': {
        name: 'Contagem Absoluta de Neutrófilos (ANC)',
        category: 'Hematologia',
        inputs: [
          { name: 'leuco', label: 'Leucócitos', unit: 'células/mm³', type: 'number' },
          { name: 'seg', label: 'Segmentados', unit: '%', type: 'number' },
          { name: 'bast', label: 'Bastões', unit: '%', type: 'number' }
        ],
        reference: 'Hematologia Clínica',
        notes: ['< 500: neutropenia grave - risco crítico']
      }
    }
  };

  const quickActions = [
    {
      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0016.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 002 8.5c0 2.3 1.5 4.05 3 5.5l7 7 7-7z" /></svg>,
      label: 'Posologia de Medicamento',
      prompt: 'Qual a dose de ',
      assistantType: 'Assistente Geral'
    },
    {
      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" /></svg>,
      label: 'Discutir Caso',
      prompt: 'Gostaria de discutir um caso clínico sobre ',
      assistantType: 'Assistente Geral'
    },
    {
      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /></svg>,
      label: 'Pesquisar CID',
      prompt: 'Qual o código CID para ',
      assistantType: 'Assistente Geral'
    },
    {
      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20M2 12h20" /></svg>,
      label: 'Cálculo de Dose',
      prompt: 'Preciso calcular a dose de ',
      assistantType: 'Calculadoras'
    },
  ];

  // Placeholders dinâmicos para cada tipo de assistente
  const assistantPlaceholders = {
    'Assistente Geral': 'Como posso lhe ajudar?',
    'Calculadoras': 'Com qual cálculo clínico posso lhe ajudar hoje?',
    'Pediatria': 'Como posso ajudar com pediatria?'
  };

  // Função para gerar pergunta de acompanhamento contextual
  const generateFollowUpQuestion = async (userQuestion, aiResponse) => {
    try {
      const prompt = `Baseado nesta conversa:

Usuário perguntou: "${userQuestion}"
Resposta da IA: "${aiResponse.substring(0, 500)}..."

Gere UMA pergunta de acompanhamento relevante e útil que eu possa fazer para aprofundar ou complementar este assunto. A pergunta deve ser direta, específica e relacionada ao contexto médico da conversa. Responda APENAS com a pergunta, sem explicações adicionais. A pergunta deve começar com: "Gostaria de ver"`;

      const response = await fetch(`${API_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: prompt,
          assistantType: 'geral'
        })
      });

      const data = await response.json();

      if (data.success && data.response) {
        return `\n\n---\n\n💡 **Sugestão:** ${data.response.trim()}`;
      }
      return '';
    } catch (error) {
      console.error('Erro ao gerar pergunta de acompanhamento:', error);
      return '';
    }
  };

  const handleSendMessage = async () => {
    if (inputValue.trim()) {
      // Criar nova conversa se não existir
      if (!currentConversationId) {
        setCurrentConversationId(`conv_${Date.now()}`);
      }

      const userMessage = inputValue;
      // Pegar primeiro nome do usuário
      const firstName = user?.name?.split(' ')[0] || 'Usuário';
      setMessages([...messages, {
        type: 'user',
        content: userMessage,
        timestamp: new Date(),
        userName: firstName
      }]);
      setInputValue('');
      setIsThinking(true);

      try {
        // Mapear tipos de assistente para formato da API
        const assistantTypeMap = {
          'Assistente Geral': 'geral',
          'Calculadoras': 'calculadoras',
          'Pediatria': 'pediatria',
          'Emergência': 'emergencia'
        };

        // Obter system prompt baseado no contexto atual
        const systemMessage = getSystemPrompt(currentContext);

        // Obter feedbacks anteriores para contexto de aprendizado
        const recentFeedbacks = JSON.parse(localStorage.getItem('messageFeedbacks') || '[]');
        const negativeFeedbacks = recentFeedbacks.filter(f => f.feedback === 'negative').slice(-5);
        const positiveFeedbacks = recentFeedbacks.filter(f => f.feedback === 'positive').slice(-5);

        // Criar contexto de feedback para a IA
        let feedbackContext = '';
        if (negativeFeedbacks.length > 0) {
          feedbackContext += '\n\nIMPORTANTE: O usuário marcou como "não útil" respostas anteriores sobre: ' +
            negativeFeedbacks.map(f => f.messageContent).join('; ') +
            '. Ajuste sua abordagem para ser mais precisa e útil.';
        }
        if (positiveFeedbacks.length > 0) {
          feedbackContext += '\n\nO usuário achou útil respostas sobre: ' +
            positiveFeedbacks.map(f => f.messageContent).join('; ') +
            '. Continue neste estilo.';
        }

        // Obter token de autenticação (authToken é o nome correto no localStorage)
        const token = localStorage.getItem('authToken');

        const response = await fetch(`${API_URL}/api/chat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            message: userMessage,
            assistantType: assistantTypeMap[selectedAssistant] || currentContext,
            conversationId: currentConversationId,
            systemMessage: systemMessage + feedbackContext // Enviar system prompt contextual com feedback
          })
        });

        const data = await response.json();
        setIsThinking(false);

        if (data.success) {
          // Adicionar mensagem vazia que será preenchida com streaming
          const messageIndex = messages.length + 1; // +1 porque já adicionamos a mensagem do usuário

          // Adicionar pergunta contextual ao final da resposta
          const followUpQuestion = await generateFollowUpQuestion(userMessage, data.response);
          const responseWithQuestion = data.response + '\n\n' + followUpQuestion;

          setMessages(prev => [...prev, {
            type: 'assistant',
            content: '',
            timestamp: new Date(),
            assistantName: 'CinthiaMed IA',
            isStreaming: true
          }]);

          // Iniciar streaming do texto
          await streamText(responseWithQuestion, messageIndex, data.scientificSources, data.suggestedTools);
        } else {
          setMessages(prev => [...prev, {
            type: 'assistant',
            content: 'Desculpe, ocorreu um erro ao processar sua pergunta. Por favor, tente novamente.',
            timestamp: new Date(),
            assistantName: 'CinthiaMed IA'
          }]);
        }
      } catch (error) {
        console.error('Erro ao consultar IA:', error);
        setIsThinking(false);
        setMessages(prev => [...prev, {
          type: 'assistant',
          content: 'Erro ao conectar com o servidor. Certifique-se de que o backend está rodando na porta 5000.',
          timestamp: new Date(),
          assistantName: 'CinthiaMed IA'
        }]);
      }
    }
  };

  const handleMenuClick = (action) => {
    // Salvar conversa atual antes de trocar de contexto
    if (messages.length > 0) {
      saveCurrentConversation();
    }

    // Atualizar contexto baseado na ação do menu
    const newContext = MENU_TO_CONTEXT[action] || 'chat';
    const previousContext = currentContext;

    setActiveMenuAction(action);
    setCurrentContext(newContext);

    // Se mudou de contexto, limpar chat e criar nova sessão
    if (newContext !== previousContext) {
      setMessages([]);
      setCurrentConversationId(null); // Força criação de nova conversa
      setShowWelcomeMessage(false); // Esconder mensagem de boas-vindas
    }

    // Gerenciar views específicas
    if (action === 'recording') {
      setCurrentView('recording');
    } else if (action === 'exam-reader') {
      setCurrentView('exam-reader');
    } else if (action === 'scores') {
      setCurrentView('scores');
    } else if (action === 'calculator') {
      setCurrentView('chat');
      setSelectedAssistant('Calculadoras');
    } else if (action === 'new') {
      // Nova conversa no mesmo contexto
      createNewConversation();
      setCurrentView('chat');
    } else if (action === 'pediatric') {
      setCurrentView('chat');
      setSelectedAssistant('Pediatria');
    } else {
      setCurrentView('chat');
    }
  };

  // Create new conversation when changing assistant type (if there are messages)
  useEffect(() => {
    if (prevAssistantRef.current !== selectedAssistant && messages.length > 0) {
      saveCurrentConversation();
      setMessages([]);
      setCurrentConversationId(`conv_${Date.now()}`);
    }
    prevAssistantRef.current = selectedAssistant;
  }, [selectedAssistant, messages.length]);

  // Auto-save conversation to recents 5 seconds after first message
  useEffect(() => {
    if (messages.length > 0 && currentConversationId) {
      const timer = setTimeout(() => {
        saveCurrentConversation();
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [messages.length, currentConversationId]);

  // Funções da Calculadora Médica
  const calculateResult = (calculatorId, inputs) => {
    const calc = medicalCalculators.calculators[calculatorId];
    let result = {};
    let alerts = [];

    switch (calculatorId) {
      case 'nefro_ckd_epi_2021':
        const creat = parseFloat(inputs.creatinina_serica);
        const idade = parseInt(inputs.idade);
        const sexo = inputs.sexo;
        const kappa = sexo === 'feminino' ? 0.7 : 0.9;
        const alpha = sexo === 'feminino' ? -0.241 : -0.302;
        const sexFactor = sexo === 'feminino' ? 1.012 : 1;
        const minRatio = Math.min(creat / kappa, 1);
        const maxRatio = Math.max(creat / kappa, 1);
        const tfg = 142 * Math.pow(minRatio, alpha) * Math.pow(maxRatio, -1.200) * Math.pow(0.9938, idade) * sexFactor;
        result.value = tfg.toFixed(1);
        result.unit = 'mL/min/1.73m²';
        result.interpretation = tfg < 15 ? 'Estágio 5 - Falência Renal' : tfg < 30 ? 'Estágio 4 - DRC Grave' : tfg < 60 ? 'Estágio 3 - DRC Moderada' : tfg < 90 ? 'Estágio 2 - DRC Leve' : 'Normal';
        if (tfg < 15) alerts.push('CRÍTICO: Compatível com Falência Renal. Avaliar diálise.');
        break;

      case 'cardio_qtc_bazett':
        const qt = parseFloat(inputs.qt);
        const fc = parseFloat(inputs.fc);
        const rr = 60 / fc;
        const qtc = qt / Math.sqrt(rr);
        result.value = qtc.toFixed(0);
        result.unit = 'ms';
        result.interpretation = qtc > 500 ? 'Prolongamento Grave' : qtc > 470 ? 'Prolongado' : qtc > 450 ? 'Limítrofe' : 'Normal';
        if (qtc > 500) alerts.push('PERIGO: Alto risco de Torsades de Pointes. Suspender drogas que prolongam QT.');
        break;

      case 'cardio_grace_score':
        const graceIdade = parseInt(inputs.idade);
        const graceFc = parseInt(inputs.fc);
        const gracePas = parseInt(inputs.pas);
        const graceCreat = parseFloat(inputs.creat);
        let graceScore = 0;
        if (graceIdade < 30) graceScore += 0;
        else if (graceIdade < 40) graceScore += 8;
        else if (graceIdade < 50) graceScore += 25;
        else if (graceIdade < 60) graceScore += 41;
        else if (graceIdade < 70) graceScore += 58;
        else if (graceIdade < 80) graceScore += 75;
        else graceScore += 91;
        if (graceFc < 50) graceScore += 0;
        else if (graceFc < 70) graceScore += 3;
        else if (graceFc < 90) graceScore += 9;
        else if (graceFc < 110) graceScore += 15;
        else if (graceFc < 150) graceScore += 24;
        else graceScore += 38;
        if (inputs.parada === 'Sim') graceScore += 39;
        if (inputs.st === 'Sim') graceScore += 28;
        if (inputs.enzimas === 'Sim') graceScore += 14;
        result.value = graceScore;
        result.unit = 'pontos';
        result.interpretation = graceScore < 109 ? 'Baixo Risco (< 1%)' : graceScore < 140 ? 'Risco Intermediário (1-3%)' : 'Alto Risco (> 3%)';
        break;

      case 'hepato_child_pugh':
        const bili = parseFloat(inputs.bili);
        const alb = parseFloat(inputs.albumina);
        const inr = parseFloat(inputs.inr);
        let childScore = 0;
        if (bili < 2) childScore += 1;
        else if (bili < 3) childScore += 2;
        else childScore += 3;
        if (alb > 3.5) childScore += 1;
        else if (alb > 2.8) childScore += 2;
        else childScore += 3;
        if (inr < 1.7) childScore += 1;
        else if (inr < 2.3) childScore += 2;
        else childScore += 3;
        if (inputs.ascite === 'Ausente') childScore += 1;
        else if (inputs.ascite === 'Leve') childScore += 2;
        else childScore += 3;
        if (inputs.encef === 'Ausente') childScore += 1;
        else if (inputs.encef === 'Grau 1-2') childScore += 2;
        else childScore += 3;
        const childClass = childScore < 7 ? 'A' : childScore < 10 ? 'B' : 'C';
        result.value = `Classe ${childClass} (${childScore} pontos)`;
        result.interpretation = childClass === 'A' ? 'Sobrevida 1 ano: 100%' : childClass === 'B' ? 'Sobrevida 1 ano: 80%' : 'Sobrevida 1 ano: 45%';
        if (childClass === 'C') alerts.push('Prognóstico reservado. Sobrevida < 50% sem transplante.');
        break;

      case 'pneumo_curb65':
        let curbScore = 0;
        if (inputs.confusao === 'Sim') curbScore++;
        if (inputs.ureia === 'Sim') curbScore++;
        if (inputs.fr === 'Sim') curbScore++;
        if (inputs.pa === 'Sim') curbScore++;
        if (inputs.idade === 'Sim') curbScore++;
        result.value = curbScore;
        result.unit = 'pontos';
        result.interpretation = curbScore <= 1 ? 'Baixo Risco - Ambulatorial' : curbScore === 2 ? 'Risco Moderado - Considerar Internação' : 'Alto Risco - Internação/UTI';
        break;

      case 'uti_parkland':
        const parkPeso = parseFloat(inputs.peso);
        const scq = parseFloat(inputs.scq);
        const volume = 4 * parkPeso * scq;
        result.value = volume.toFixed(0);
        result.unit = 'mL (Ringer Lactato)';
        result.interpretation = `${(volume / 2).toFixed(0)} mL nas primeiras 8h + ${(volume / 2).toFixed(0)} mL nas 16h seguintes`;
        if (scq > 80) alerts.push('ALERTA: SCQ > 80% - altíssima mortalidade. Protocolo de queimadura maciça.');
        break;

      case 'med_anthropometry_bmi':
        const imcPeso = parseFloat(inputs.peso);
        const altura = parseFloat(inputs.altura);
        const imc = imcPeso / (altura * altura);
        result.value = imc.toFixed(1);
        result.unit = 'kg/m²';
        result.interpretation = imc < 16 ? 'Magreza Grau III' : imc < 17 ? 'Magreza Grau II' : imc < 18.5 ? 'Magreza Grau I' : imc < 25 ? 'Eutrofia' : imc < 30 ? 'Sobrepeso' : imc < 35 ? 'Obesidade Grau I' : imc < 40 ? 'Obesidade Grau II' : 'Obesidade Grau III';
        if (imc < 16) alerts.push('ALERTA: Magreza Grau III - Risco de desnutrição grave.');
        break;

      case 'ped_maintenance_fluids':
        const pedPeso = parseFloat(inputs.peso);
        let volHidrat = 0;
        if (pedPeso <= 10) volHidrat = pedPeso * 100;
        else if (pedPeso <= 20) volHidrat = 1000 + (pedPeso - 10) * 50;
        else volHidrat = 1500 + (pedPeso - 20) * 20;
        result.value = volHidrat.toFixed(0);
        result.unit = 'mL/dia';
        result.interpretation = `${(volHidrat / 24).toFixed(0)} mL/hora`;
        break;

      case 'endo_insulin_homa_ir':
        const glic = parseFloat(inputs.glicemia);
        const ins = parseFloat(inputs.insulina);
        const homa = (glic * ins) / 405;
        result.value = homa.toFixed(2);
        result.interpretation = homa > 2.7 ? 'Alta Resistência Insulínica' : 'Resistência Normal';
        break;

      case 'drug_vasopressor_infusion':
        const vasoPeso = parseFloat(inputs.peso);
        const dose = parseFloat(inputs.dose);
        const conc = parseFloat(inputs.conc);
        const vazao = (dose * vasoPeso * 60) / (conc * 1000);
        result.value = vazao.toFixed(1);
        result.unit = 'mL/h';
        result.interpretation = `Dose: ${dose} mcg/kg/min`;
        if (dose > 2.0) alerts.push('ALERTA EXTREMO: Dose > 2 mcg/kg/min - refratária. Considerar segunda droga.');
        break;

      case 'hemato_anc':
        const leuco = parseFloat(inputs.leuco);
        const seg = parseFloat(inputs.seg);
        const bast = parseFloat(inputs.bast);
        const anc = leuco * ((seg + bast) / 100);
        result.value = anc.toFixed(0);
        result.unit = 'células/mm³';
        result.interpretation = anc < 500 ? 'Neutropenia Grave' : anc < 1000 ? 'Neutropenia Moderada' : anc < 1500 ? 'Neutropenia Leve' : 'Normal';
        if (anc < 500) alerts.push('RISCO CRÍTICO: Neutropenia grave. Risco de infecção sistêmica. Precaução de isolamento.');
        break;

      default:
        result.value = 'Não calculado';
    }

    result.alerts = alerts;
    result.reference = calc.reference;
    result.notes = calc.notes;
    return result;
  };

  const handleCalculate = () => {
    if (!selectedCalculator) return;

    const calc = medicalCalculators.calculators[selectedCalculator];
    const allInputsFilled = calc.inputs.every(input => calculatorInputs[input.name]);

    if (!allInputsFilled) {
      showToastMessage('Preencha todos os campos');
      return;
    }

    const result = calculateResult(selectedCalculator, calculatorInputs);
    setCalculatorResult(result);
    showToastMessage('Cálculo realizado!');
  };

  const handleToggleRecording = async () => {
    if (!isRecording) {
      try {
        // Solicitar permissão de microfone
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const recorder = new MediaRecorder(stream);
        const audioChunks = [];

        recorder.ondataavailable = (event) => {
          audioChunks.push(event.data);
        };

        recorder.onstop = () => {
          // Tentar diferentes formatos de áudio para compatibilidade
          const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
            ? 'audio/webm;codecs=opus'
            : MediaRecorder.isTypeSupported('audio/webm')
              ? 'audio/webm'
              : 'audio/ogg';

          const audioBlob = new Blob(audioChunks, { type: mimeType });
          console.log(`🎵 Áudio gravado: ${(audioBlob.size / 1024).toFixed(2)} KB, tipo: ${mimeType}`);
          setAudioBlob(audioBlob);
          stream.getTracks().forEach(track => track.stop());
        };

        recorder.start();
        setMediaRecorder(recorder);
        setIsRecording(true);
        setRecordingTime(0);

        // Timer
        const interval = setInterval(() => {
          setRecordingTime(prev => prev + 1);
        }, 1000);

        // Salvar interval para limpar depois
        recorder.intervalId = interval;
      } catch (error) {
        console.error('Erro ao acessar microfone:', error);
        showToastMessage('Erro ao acessar o microfone. Verifique as permissões.');
      }
    } else {
      if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
        clearInterval(mediaRecorder.intervalId);
        setIsRecording(false);
      }
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handleNewReport = () => {
    // Limpar todos os dados do relatório
    setClinicalReport('');
    setAudioBlob(null);
    setRecordingTime(0);
    setPatientName('');
    setPatientAge('');
    setPatientGender('');
    setClinicalObservations('');
    setManualTranscript('');
    showToastMessage('Pronto para nova gravação!');
  };

  const handleGenerateReport = async () => {
    // Validar se há pelo menos áudio (gravação obrigatória para este fluxo)
    if (!audioBlob) {
      showToastMessage('Por favor, grave o áudio da consulta antes de gerar o prontuário.');
      return;
    }

    // Validação do áudio
    if (audioBlob.size === 0) {
      showToastMessage('Erro: O arquivo de áudio está vazio. Tente gravar novamente.');
      return;
    }

    console.log('📤 Processando consulta médica...');
    console.log(`Tamanho do áudio: ${(audioBlob.size / 1024).toFixed(2)} KB`);
    console.log(`Duração da gravação: ${recordingTime} segundos`);

    setIsGeneratingReport(true);
    setClinicalReport('');

    try {
      // Criar FormData para enviar áudio + dados do paciente
      const formData = new FormData();
      formData.append('audio', audioBlob, 'consultation.webm');
      formData.append('patientName', patientName || 'Não informado');
      formData.append('patientAge', patientAge || 'Não informada');
      formData.append('patientGender', patientGender || 'Não informado');
      formData.append('clinicalObservations', clinicalObservations || '');

      console.log('📡 Enviando para análise com IA...');
      console.log('🎤 Etapa 1: Transcrevendo áudio com Whisper...');

      const response = await fetch(`${API_URL}/api/medical-record/process-consultation`, {
        method: 'POST',
        body: formData
      });

      const data = await response.json();
      console.log('📥 Resposta recebida');

      if (data.medicalRecord) {
        console.log('✅ Transcrição concluída');
        console.log('✅ Prontuário médico gerado com sucesso');
        console.log(`📊 Duração da gravação: ${data.duration?.toFixed(1) || recordingTime}s`);
        console.log(`🔤 Tokens utilizados: ${data.tokensUsed || 'N/A'}`);

        // Armazenar transcrição para referência
        setManualTranscript(data.transcription || '');

        // Exibir prontuário formatado
        setClinicalReport(data.medicalRecord);

        // NOVO: Tentar formatar em SOAP
        try {
          console.log('🏥 Formatando prontuário em SOAP...');
          const soapFormatted = await formatToSOAP(data.transcription || data.medicalRecord, {
            name: patientName,
            age: patientAge,
            gender: patientGender
          });

          setCurrentSOAP(soapFormatted);
          setShowSOAPViewer(true);
          showToastMessage('Prontuário SOAP gerado com sucesso!');
        } catch (soapError) {
          console.warn('⚠️  Não foi possível formatar em SOAP, usando formato local:', soapError);
          // Fallback: usar formatação local
          const localSOAP = generateSOAPLocal(data.transcription || data.medicalRecord, {
            name: patientName,
            age: patientAge,
            gender: patientGender
          });
          setCurrentSOAP(localSOAP);
          setShowSOAPViewer(true);
          showToastMessage('Prontuário médico gerado com sucesso!');
        }

        // Log da transcrição para debug
        if (data.transcription) {
          console.log('📝 Transcrição completa:', data.transcription);
        }
      } else {
        const errorMsg = data.details || data.error || 'Erro desconhecido ao processar consulta';
        showToastMessage('Erro: ' + errorMsg);
        console.error('❌ Erro do servidor:', data);
      }
    } catch (error) {
      console.error('❌ Erro ao processar consulta:', error);
      showToastMessage('Erro ao conectar com o servidor. Verifique se o backend está rodando.');
    } finally {
      setIsGeneratingReport(false);
    }
  };


  // Helper function to get category for a score
  const getCategoryForScore = (scoreName) => {
    const scoreCategories = {
      'PECARN TCE': 'Neurologia',
      'Ânion Gap': 'Calculadoras Gerais',
      'Idade Gestacional': 'Calculadoras Gerais',
      'IMC e ASC': 'Calculadoras Gerais',
      'QTc': 'Cardiologia',
      'Osmolalidade': 'Calculadoras Gerais',
      'CIWA-Ar': 'Psiquiatria',
      'Correção de Cálcio': 'Calculadoras Gerais',
      'Correção de Sódio': 'Calculadoras Gerais',
      'Framingham': 'Cardiologia',
      'Hestia': 'Emergência',
      'Sgarbossa': 'UTI',
      'Wells TEP': 'Emergência',
      'Wells TVP': 'Emergência',
      'Déficit Água Livre': 'Calculadoras Gerais',
      'Depuração Creatinina': 'Calculadoras Gerais',
      'MDRD': 'Calculadoras Gerais',
      'RASS': 'Neurologia',
      'NIHSS': 'Neurologia',
      'Glasgow': 'Neurologia',
      '2HELPS2B': 'Emergência',
      'ABCD²': 'Neurologia',
      'AIR': 'Gastroenterologia',
      'CHA₂DS₂-VASc': 'Cardiologia',
      'CURB-65': 'Pneumologia',
      'Alvarado': 'Gastroenterologia',
      'EDACS': 'Emergência',
      'Centor': 'Emergência',
      'Dissecção Aórtica': 'Emergência',
      'Genebra': 'Emergência',
      'Risco Genebra TEV': 'Emergência',
      'Síncope Canadense': 'Emergência',
      'TIMI': 'Cardiologia',
      'Rockall': 'Gastroenterologia',
      'Glasgow-Blatchford': 'Gastroenterologia',
      'FeverPAIN': 'Emergência',
      'HEART': 'Cardiologia',
      'MACOCHA': 'UTI',
      'NEWS 2': 'Pneumologia',
      'PSI/PORT': 'Pneumologia',
      'qSOFA': 'Pneumologia',
      'SOFA': 'Pneumologia',
      'Índice de Choque': 'Cardiologia',
      'PESI': 'Emergência',
      'Mortalidade Endarterectomia': 'Cardiologia',
      'NEXUS Crânio': 'Neurologia',
      'NEXUS Coluna': 'Neurologia',
      'NEXUS Tórax': 'Emergência',
      'Peso Corporal Ideal': 'Calculadoras Gerais',
      'PAM': 'Cardiologia',
      'Regra Canadense TC': 'Neurologia',
      'Ottawa HSA': 'Neurologia',
      'PERC': 'Emergência',
      'TFG CKD-EPI': 'Calculadoras Gerais',
      '4AT': 'Neurologia',
      '6MWT': 'Pneumologia'
    };
    return scoreCategories[scoreName] || 'Geral';
  };

  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      width: '100%',
      maxWidth: '100vw',
      backgroundColor: 'var(--bg-primary)',
      fontFamily: "'Outfit', 'SF Pro Display', -apple-system, sans-serif",
      color: 'var(--text-primary)',
      overflow: 'hidden',
      overflowX: 'hidden',
      position: 'relative',
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap');

        * {
          box-sizing: border-box;
        }

        ::-webkit-scrollbar {
          width: 6px;
        }

        ::-webkit-scrollbar-track {
          background: transparent;
        }

        ::-webkit-scrollbar-thumb {
          background: #334155;
          border-radius: 3px;
        }

        @keyframes pulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.8; }
        }

        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }

        @keyframes glow {
          0%, 100% { box-shadow: 0 0 20px rgba(139, 92, 246, 0.3); }
          50% { box-shadow: 0 0 40px rgba(139, 92, 246, 0.6); }
        }

        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        @keyframes slideIn {
          from {
            transform: translateX(400px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>

      {/* Mobile Menu Button */}
      {isMobile && (
        <button
          onClick={() => setShowMobileSidebar(!showMobileSidebar)}
          style={{
            position: 'fixed',
            top: 'var(--spacing-md)',
            left: 'var(--spacing-md)',
            zIndex: 200,
            minWidth: 'var(--touch-min)',
            minHeight: 'var(--touch-min)',
            width: 'var(--touch-min)',
            height: 'var(--touch-min)',
            borderRadius: 'var(--spacing-sm)',
            backgroundColor: 'var(--bg-elevated)',
            border: '1px solid var(--border-accent)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 0.25rem 0.75rem rgba(0, 0, 0, 0.3)',
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--text-primary)" strokeWidth="2">
            {showMobileSidebar ? (
              <path d="M18 6L6 18M6 6l12 12" />
            ) : (
              <>
                <path d="M3 12h18M3 6h18M3 18h18" />
              </>
            )}
          </svg>
        </button>
      )}

      {/* Sidebar */}
      <aside
        style={{
          width: isMobile ? 'var(--sidebar-expanded)' : (sidebarCollapsed ? 'var(--sidebar-collapsed)' : 'var(--sidebar-expanded)'),
          backgroundColor: 'var(--bg-secondary)',
          borderRight: '1px solid var(--border-primary)',
          display: 'flex',
          flexDirection: 'column',
          transition: isMobile ? 'transform 0.3s ease' : 'width 0.3s ease',
          position: isMobile ? 'fixed' : 'relative',
          top: 0,
          left: 0,
          bottom: 0,
          zIndex: isMobile ? 150 : 10,
          transform: isMobile ? (showMobileSidebar ? 'translateX(0)' : 'translateX(-100%)') : 'translateX(0)',
        }}
        onMouseEnter={() => !isMobile && setSidebarCollapsed(false)}
        onMouseLeave={() => !isMobile && setSidebarCollapsed(true)}
      >
        {/* Logo */}
        <div style={{
          padding: 'var(--spacing-lg) var(--spacing-md)',
          borderBottom: '1px solid var(--border-primary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          {!sidebarCollapsed && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 50%, #f97316 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px',
                fontWeight: '700',
                color: 'white',
                boxShadow: '0 4px 15px rgba(139, 92, 246, 0.4)',
              }}>
                C
              </div>
              <span style={{
                fontSize: '22px',
                fontWeight: '600',
                background: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                letterSpacing: '-0.5px',
              }}>
                CinthiaMed
              </span>
            </div>
          )}
          {sidebarCollapsed && (
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 50%, #f97316 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px',
              fontWeight: '700',
              color: 'white',
              boxShadow: '0 4px 15px rgba(139, 92, 246, 0.4)',
            }}>
              C
            </div>
          )}
        </div>

        {/* Menu Items */}
        <nav style={{
          padding: '16px 12px',
          flex: 1,
          overflowY: 'auto',
        }}>
          {menuItems.map((item, index) => (
            <button
              key={index}
              onClick={() => {
                handleMenuClick(item.action);
                if (isMobile) setShowMobileSidebar(false); // Fecha o menu em mobile
              }}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--spacing-sm)',
                padding: (sidebarCollapsed && !isMobile) ? 'var(--spacing-sm)' : 'var(--spacing-sm) var(--spacing-md)',
                marginBottom: 'var(--spacing-xs)',
                backgroundColor: activeMenuAction === item.action ? 'rgba(139, 92, 246, 0.15)' : 'transparent',
                border: activeMenuAction === item.action ? '1px solid rgba(139, 92, 246, 0.3)' : '1px solid transparent',
                borderRadius: 'var(--spacing-sm)',
                color: activeMenuAction === item.action ? '#a78bfa' : 'var(--text-muted)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                fontSize: 'var(--font-base)',
                fontWeight: '500',
                justifyContent: (sidebarCollapsed && !isMobile) ? 'center' : 'flex-start',
                fontFamily: "'Outfit', sans-serif",
                minHeight: 'var(--touch-min)',
              }}
              onMouseEnter={(e) => {
                const isActive = activeMenuAction === item.action;
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = 'var(--bg-elevated)';
                  e.currentTarget.style.color = 'var(--text-primary)';
                }
              }}
              onMouseLeave={(e) => {
                const isActive = activeMenuAction === item.action;
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = 'var(--text-muted)';
                }
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{item.icon}</span>
              {(isMobile || !sidebarCollapsed) && <span>{item.label}</span>}
            </button>
          ))}
        </nav>

        {/* Favorites & Recent */}
        {!sidebarCollapsed && (
          <div style={{
            padding: '16px',
            borderTop: '1px solid #1e293b',
            overflowY: 'auto',
            maxHeight: '300px',
          }}>
            {/* Favoritos */}
            <div style={{ marginBottom: '16px' }}>
              <h4 style={{
                fontSize: '11px',
                fontWeight: '600',
                color: '#64748b',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                marginBottom: '8px',
              }}>Favoritos</h4>
              {conversations.filter(c => c.isFavorite).length > 0 ? (
                conversations.filter(c => c.isFavorite).map(conv => (
                  <div
                    key={conv.id}
                    onClick={() => loadConversation(conv.id)}
                    style={{
                      padding: '8px 10px',
                      marginBottom: '4px',
                      backgroundColor: currentConversationId === conv.id ? 'rgba(139, 92, 246, 0.15)' : 'transparent',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      transition: 'background-color 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      if (currentConversationId !== conv.id) {
                        e.currentTarget.style.backgroundColor = '#1e293b';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (currentConversationId !== conv.id) {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }
                    }}
                  >
                    <p style={{
                      fontSize: '13px',
                      color: '#e2e8f0',
                      margin: 0,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}>
                      {conv.title}
                    </p>
                  </div>
                ))
              ) : (
                <p style={{ fontSize: '13px', color: '#475569', margin: 0 }}>Nenhuma conversa</p>
              )}
            </div>

            {/* Recentes */}
            <div>
              <h4 style={{
                fontSize: '11px',
                fontWeight: '600',
                color: '#64748b',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                marginBottom: '8px',
              }}>Recentes</h4>
              <div style={{
                maxHeight: '144px', // 3 itens × ~48px cada = 144px
                overflowY: 'auto',
                overflowX: 'hidden',
                scrollbarWidth: 'thin',
                scrollbarColor: '#475569 transparent',
              }}>
                {conversations.filter(c => !c.isFavorite).slice(0, 7).length > 0 ? (
                  conversations
                    .filter(c => !c.isFavorite)
                    .sort((a, b) => b.lastUpdated - a.lastUpdated)
                    .slice(0, 7)
                    .map(conv => (
                      <div
                        key={conv.id}
                        onClick={() => loadConversation(conv.id)}
                        style={{
                          padding: '8px 10px',
                          marginBottom: '4px',
                          backgroundColor: currentConversationId === conv.id ? 'rgba(139, 92, 246, 0.15)' : 'transparent',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          transition: 'background-color 0.2s',
                        }}
                        onMouseEnter={(e) => {
                          if (currentConversationId !== conv.id) {
                            e.currentTarget.style.backgroundColor = '#1e293b';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (currentConversationId !== conv.id) {
                            e.currentTarget.style.backgroundColor = 'transparent';
                          }
                        }}
                      >
                        <p style={{
                          fontSize: '13px',
                          color: currentConversationId === conv.id ? '#a78bfa' : '#e2e8f0',
                          margin: 0,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          fontWeight: currentConversationId === conv.id ? '600' : '400',
                        }}>
                          {conv.title}
                        </p>
                      </div>
                    ))
                ) : (
                  <p style={{ fontSize: '13px', color: '#475569', margin: 0 }}>Nenhuma conversa</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* User Profile */}
        <div style={{
          padding: '16px',
          borderTop: '1px solid #1e293b',
          position: 'relative',
        }}>
          <div
            onClick={() => setShowUserMenu(!showUserMenu)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
              cursor: 'pointer',
              padding: '8px',
              borderRadius: '12px',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1e293b'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: user?.avatar_url ? `url(${user.avatar_url})` : 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '16px',
              fontWeight: '600',
              color: 'white',
              flexShrink: 0,
            }}>
              {!user?.avatar_url && (user?.name?.[0]?.toUpperCase() || 'U')}
            </div>
            {!sidebarCollapsed && (
              <>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '14px', fontWeight: '500', margin: 0 }}>{user?.name || 'Usuário'}</p>
                  <p style={{ fontSize: '12px', color: '#64748b', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {user?.email || 'email@example.com'}
                  </p>
                </div>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" style={{
                  transform: showUserMenu ? 'rotate(90deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s',
                }}>
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </>
            )}
          </div>

          {/* User Menu Dropdown */}
          {showUserMenu && !sidebarCollapsed && (
            <div style={{
              position: 'absolute',
              bottom: '80px',
              left: '16px',
              right: '16px',
              backgroundColor: '#1a1f2e',
              border: '1px solid #2a3142',
              borderRadius: '12px',
              boxShadow: '0 10px 40px rgba(0, 0, 0, 0.4)',
              zIndex: 1000,
              overflow: 'hidden',
            }}>
              <button
                onClick={() => {
                  setShowUserMenu(false);
                  // Adicionar lógica de configurações
                }}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  borderBottom: '1px solid #2a3142',
                  color: '#e2e8f0',
                  textAlign: 'left',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontFamily: "'Outfit', sans-serif",
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  transition: 'background-color 0.2s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#2a3142'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M12 1v6m0 6v6m5.657-13.657l-4.243 4.243m-4.243 4.243l-4.243 4.243m11.313 0l-4.243-4.243m-4.243-4.243l-4.243-4.243" />
                </svg>
                Configurações
              </button>
              <button
                onClick={() => {
                  setShowUserMenu(false);
                  // Limpar o flag de boas-vindas ao fazer logout
                  localStorage.removeItem(`hasSeenWelcome_${user.email}`);
                  onLogout();
                }}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  color: '#ef4444',
                  textAlign: 'left',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontFamily: "'Outfit', sans-serif",
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  transition: 'background-color 0.2s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
                </svg>
                Sair
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {isMobile && showMobileSidebar && (
        <div
          onClick={() => setShowMobileSidebar(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            zIndex: 140,
            backdropFilter: 'blur(4px)',
          }}
        />
      )}

      {/* Main Content */}
      <main style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
        marginRight: '0',
        transition: 'margin-right 0.3s ease',
      }}>
        {/* Background Effect */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -60%)',
          width: '500px',
          height: '500px',
          background: 'radial-gradient(circle, rgba(139, 92, 246, 0.15) 0%, rgba(236, 72, 153, 0.08) 40%, transparent 70%)',
          borderRadius: '50%',
          filter: 'blur(60px)',
          pointerEvents: 'none',
          animation: 'pulse 4s ease-in-out infinite',
        }} />

        {/* Content Area - Chat, Recording ou Exam Analysis */}
        {currentView === 'chat' ? (
          /* Chat Area */
          <>
            {/* Header com botões de ação */}
            {messages.length > 0 && (
              <div style={{
                padding: isMobile ? 'var(--spacing-sm) var(--spacing-md) var(--spacing-sm) 4.5rem' : 'var(--spacing-md) var(--spacing-2xl)',
                paddingRight: isMobile ? 'var(--spacing-md)' : 'var(--spacing-2xl)',
                borderBottom: '1px solid var(--border-primary)',
                display: 'flex',
                justifyContent: 'flex-end',
                gap: 'var(--spacing-sm)',
                position: 'relative',
                zIndex: 150,
                transition: 'padding-right 0.3s ease',
              }}>
                {/* Botão Nova Conversa */}
                <button
                  onClick={createNewConversation}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--spacing-xs)',
                    padding: 'var(--spacing-xs) var(--spacing-md)',
                    minHeight: 'var(--touch-min)',
                    backgroundColor: 'transparent',
                    border: '1px solid var(--border-accent)',
                    borderRadius: 'var(--spacing-xs)',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    fontSize: 'var(--font-base)',
                    fontWeight: '500',
                    transition: 'all 0.2s',
                    fontFamily: "'Outfit', sans-serif",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(139, 92, 246, 0.1)';
                    e.currentTarget.style.borderColor = 'var(--accent-primary)';
                    e.currentTarget.style.color = 'var(--accent-primary)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.borderColor = 'var(--border-accent)';
                    e.currentTarget.style.color = 'var(--text-muted)';
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                  {!isMobile && 'Nova Conversa'}
                </button>

                {/* Botão Favoritar */}
                <button
                  onClick={toggleFavorite}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--spacing-xs)',
                    padding: 'var(--spacing-xs) var(--spacing-md)',
                    minHeight: 'var(--touch-min)',
                    backgroundColor: 'transparent',
                    border: `1px solid ${isCurrentConversationFavorite() ? 'var(--warning)' : 'var(--border-accent)'}`,
                    borderRadius: 'var(--spacing-xs)',
                    color: isCurrentConversationFavorite() ? 'var(--warning)' : 'var(--text-muted)',
                    cursor: 'pointer',
                    fontSize: 'var(--font-base)',
                    fontWeight: '500',
                    transition: 'all 0.2s',
                    fontFamily: "'Outfit', sans-serif",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(251, 191, 36, 0.1)';
                    e.currentTarget.style.borderColor = 'var(--warning)';
                    e.currentTarget.style.color = 'var(--warning)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.borderColor = isCurrentConversationFavorite() ? 'var(--warning)' : 'var(--border-accent)';
                    e.currentTarget.style.color = isCurrentConversationFavorite() ? 'var(--warning)' : 'var(--text-muted)';
                  }}
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill={isCurrentConversationFavorite() ? '#fbbf24' : 'none'}
                    stroke={isCurrentConversationFavorite() ? '#fbbf24' : 'currentColor'}
                    strokeWidth="2"
                  >
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                  {isCurrentConversationFavorite() ? 'Favoritada' : 'Favoritar conversa'}
                </button>
              </div>
            )}

            <div style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: messages.length === 0 ? 'center' : 'flex-start',
              padding: isMobile ? 'var(--spacing-md)' : 'var(--spacing-2xl) var(--spacing-md)',
              marginRight: '0',
              overflowY: 'auto',
              position: 'relative',
              zIndex: 1,
              transition: 'margin-right 0.3s ease',
            }}>
              {messages.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  maxWidth: '600px',
                }}>
                  {/* Logo Animation */}
                  <div style={{
                    marginBottom: '40px',
                    animation: 'float 3s ease-in-out infinite',
                  }}>
                    <div style={{
                      width: '140px',
                      height: '140px',
                      margin: '0 auto',
                      borderRadius: '35px',
                      background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.9) 0%, rgba(236, 72, 153, 0.9) 50%, rgba(249, 115, 22, 0.9) 100%)',
                      backgroundSize: '200% 200%',
                      animation: 'gradientShift 3s ease infinite, glow 2s ease-in-out infinite',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 20px 60px rgba(139, 92, 246, 0.4)',
                    }}>
                      <span style={{
                        fontSize: '20px',
                        fontWeight: '600',
                        color: 'white',
                        fontFamily: "'Outfit', sans-serif",
                        letterSpacing: '-0.5px',
                      }}>
                        CinthiaMed
                      </span>
                    </div>
                  </div>

                  {showWelcomeMessage && (
                    <h1 style={{
                      fontSize: '28px',
                      fontWeight: '300',
                      color: '#e2e8f0',
                      marginBottom: '20px',
                      letterSpacing: '-0.5px',
                    }}>
                      {isReturningUser
                        ? `Bem-vindo(a) de volta, ${user?.name?.split(' ')[0] || 'Doutor(a)'}!`
                        : `Bem-vindo(a) à CinthiaMed, ${user?.name?.split(' ')[0] || 'Doutor(a)'}!`
                      }
                    </h1>
                  )}
                </div>
              ) : (
                <div style={{
                  width: '100%',
                  maxWidth: 'var(--container-md)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 'var(--spacing-md)',
                  paddingRight: isMobile ? '0' : 'var(--spacing-md)',
                }}>
                  {messages.map((msg, index) => (
                    <div
                      key={index}
                      style={{
                        display: 'flex',
                        justifyContent: msg.type === 'user' ? 'flex-end' : 'flex-start',
                        marginBottom: '24px',
                      }}
                    >
                      <div style={{
                        display: 'inline-flex',
                        flexDirection: 'column',
                        alignItems: msg.type === 'user' ? 'flex-end' : 'flex-start',
                        maxWidth: isMobile ? '90%' : '75%',
                        minWidth: (msg.content.length < 50 || isMobile) ? 'auto' : '300px',
                      }}>
                        {/* Avatar */}
                        <div style={{
                          width: '48px',
                          height: '48px',
                          borderRadius: '50%',
                          background: msg.type === 'assistant'
                            ? 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 50%, #f97316 100%)'
                            : 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          boxShadow: '0 4px 15px rgba(139, 92, 246, 0.4)',
                          marginBottom: '8px',
                        }}>
                          {msg.type === 'assistant' ? (
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                              <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V7.3l7-3.11v8.8z" />
                            </svg>
                          ) : (
                            <span style={{
                              fontSize: '18px',
                              fontWeight: '600',
                              color: 'white',
                            }}>M</span>
                          )}
                        </div>

                        {/* Name and Timestamp */}
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          marginBottom: '8px',
                          fontSize: '13px',
                        }}>
                          <span style={{
                            fontWeight: '600',
                            color: msg.type === 'assistant' ? '#a78bfa' : '#8b5cf6',
                          }}>
                            {msg.type === 'assistant' ? msg.assistantName : msg.userName}
                          </span>
                          <span style={{
                            color: '#64748b',
                          }}>
                            {msg.timestamp ? formatDateTime(msg.timestamp) : ''}
                          </span>
                        </div>

                        {/* Message Bubble */}
                        <div style={{
                          width: '100%',
                          padding: '16px 20px',
                          borderRadius: '16px',
                          backgroundColor: msg.type === 'user' ? 'rgba(139, 92, 246, 0.15)' : '#2a3142',
                          border: msg.type === 'user' ? '1px solid rgba(139, 92, 246, 0.3)' : '1px solid #3a4152',
                          color: '#e2e8f0',
                          fontSize: '15px',
                          lineHeight: '1.6',
                        }}>
                          {msg.type === 'assistant' ? (
                            <ReactMarkdown
                              remarkPlugins={[remarkMath]}
                              rehypePlugins={[rehypeKatex, rehypeSanitize]}
                              components={{
                                p: ({ node, ...props }) => <p style={{ marginBottom: '1em', margin: 0 }} {...props} />,
                                code: ({ node, inline, ...props }) => (
                                  inline ?
                                    <code style={{
                                      backgroundColor: 'rgba(139, 92, 246, 0.2)',
                                      padding: '2px 6px',
                                      borderRadius: '4px',
                                      fontSize: '14px'
                                    }} {...props} /> :
                                    <code style={{
                                      display: 'block',
                                      backgroundColor: '#1a1f2e',
                                      padding: '12px',
                                      borderRadius: '8px',
                                      overflowX: 'auto',
                                      fontSize: '14px',
                                      marginBottom: '1em'
                                    }} {...props} />
                                )
                              }}
                            >
                              {msg.content}
                            </ReactMarkdown>
                          ) : msg.content}
                        </div>

                        {/* Action Buttons - Only for assistant messages */}
                        {msg.type === 'assistant' && (
                          <div style={{
                            display: 'flex',
                            gap: '8px',
                            marginTop: '8px',
                            alignItems: 'center'
                          }}>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(msg.content);
                                showToastMessage('Resposta copiada!');
                              }}
                              style={{
                                padding: '6px 12px',
                                backgroundColor: 'transparent',
                                border: '1px solid #3a4152',
                                borderRadius: '8px',
                                color: '#94a3b8',
                                fontSize: '12px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                transition: 'all 0.2s',
                                fontFamily: "'Outfit', sans-serif"
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = '#3a4152';
                                e.currentTarget.style.color = '#e2e8f0';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'transparent';
                                e.currentTarget.style.color = '#94a3b8';
                              }}
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                              </svg>
                              Copiar
                            </button>
                            <button
                              onClick={() => handleMessageFeedback(index, true)}
                              style={{
                                padding: 'var(--spacing-xs) var(--spacing-sm)',
                                backgroundColor: messageFeedbacks[index] === 'positive' ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
                                border: `1px solid ${messageFeedbacks[index] === 'positive' ? 'var(--success)' : 'var(--border-accent)'}`,
                                borderRadius: 'var(--spacing-xs)',
                                color: messageFeedbacks[index] === 'positive' ? 'var(--success)' : 'var(--text-muted)',
                                fontSize: 'var(--font-xs)',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 'var(--spacing-xs)',
                                transition: 'all 0.2s',
                                fontFamily: "'Outfit', sans-serif",
                                minHeight: 'var(--touch-min)',
                              }}
                              onMouseEnter={(e) => {
                                if (messageFeedbacks[index] !== 'positive') {
                                  e.currentTarget.style.backgroundColor = 'rgba(16, 185, 129, 0.1)';
                                  e.currentTarget.style.borderColor = 'var(--success)';
                                  e.currentTarget.style.color = 'var(--success)';
                                }
                              }}
                              onMouseLeave={(e) => {
                                if (messageFeedbacks[index] !== 'positive') {
                                  e.currentTarget.style.backgroundColor = 'transparent';
                                  e.currentTarget.style.borderColor = 'var(--border-accent)';
                                  e.currentTarget.style.color = 'var(--text-muted)';
                                }
                              }}
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill={messageFeedbacks[index] === 'positive' ? 'var(--success)' : 'none'} stroke="currentColor" strokeWidth="2">
                                <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
                              </svg>
                              Útil
                            </button>
                            <button
                              onClick={() => handleMessageFeedback(index, false)}
                              style={{
                                padding: 'var(--spacing-xs) var(--spacing-sm)',
                                backgroundColor: messageFeedbacks[index] === 'negative' ? 'rgba(239, 68, 68, 0.15)' : 'transparent',
                                border: `1px solid ${messageFeedbacks[index] === 'negative' ? 'var(--error)' : 'var(--border-accent)'}`,
                                borderRadius: 'var(--spacing-xs)',
                                color: messageFeedbacks[index] === 'negative' ? 'var(--error)' : 'var(--text-muted)',
                                fontSize: 'var(--font-xs)',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 'var(--spacing-xs)',
                                transition: 'all 0.2s',
                                fontFamily: "'Outfit', sans-serif",
                                minHeight: 'var(--touch-min)',
                              }}
                              onMouseEnter={(e) => {
                                if (messageFeedbacks[index] !== 'negative') {
                                  e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
                                  e.currentTarget.style.borderColor = 'var(--error)';
                                  e.currentTarget.style.color = 'var(--error)';
                                }
                              }}
                              onMouseLeave={(e) => {
                                if (messageFeedbacks[index] !== 'negative') {
                                  e.currentTarget.style.backgroundColor = 'transparent';
                                  e.currentTarget.style.borderColor = 'var(--border-accent)';
                                  e.currentTarget.style.color = 'var(--text-muted)';
                                }
                              }}
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill={messageFeedbacks[index] === 'negative' ? 'var(--error)' : 'none'} stroke="currentColor" strokeWidth="2" transform="scale(1, -1)">
                                <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
                              </svg>
                              Não útil
                            </button>
                          </div>
                        )}

                        {/* Scientific Sources */}
                        {msg.sources && msg.sources.length > 0 && (
                          <div style={{
                            width: '100%',
                            marginTop: '12px',
                            padding: '12px 16px',
                            backgroundColor: '#1a1f2e',
                            borderRadius: '12px',
                            border: '1px solid #2a3142',
                          }}>
                            <div style={{
                              fontSize: '12px',
                              fontWeight: '600',
                              color: '#8b5cf6',
                              marginBottom: '8px',
                              textTransform: 'uppercase',
                              letterSpacing: '0.5px',
                            }}>
                              📚 Fontes Científicas:
                            </div>
                            {msg.sources.map((source, idx) => (
                              <div key={idx} style={{
                                marginBottom: idx < msg.sources.length - 1 ? '8px' : '0',
                                paddingBottom: idx < msg.sources.length - 1 ? '8px' : '0',
                                borderBottom: idx < msg.sources.length - 1 ? '1px solid #2a3142' : 'none',
                              }}>
                                <a
                                  href={source.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{
                                    fontSize: '13px',
                                    color: '#64748b',
                                    textDecoration: 'none',
                                    display: 'block',
                                    lineHeight: '1.5',
                                  }}
                                  onMouseEnter={(e) => e.target.style.color = '#8b5cf6'}
                                  onMouseLeave={(e) => e.target.style.color = '#64748b'}
                                >
                                  <strong style={{ color: '#e2e8f0' }}>{source.title}</strong><br />
                                  {source.authors} - {source.journal} ({source.year})
                                </a>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}


                  {/* Indicador de "pensando" */}
                  {isThinking && (
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'flex-start',
                        marginBottom: '24px',
                      }}
                    >
                      <div style={{
                        display: 'inline-flex',
                        flexDirection: 'column',
                        alignItems: 'flex-start',
                        maxWidth: '75%',
                      }}>
                        {/* Avatar */}
                        <div style={{
                          width: '48px',
                          height: '48px',
                          borderRadius: '50%',
                          background: 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 50%, #f97316 100%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          boxShadow: '0 4px 15px rgba(139, 92, 246, 0.4)',
                          marginBottom: '8px',
                        }}>
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                            <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V7.3l7-3.11v8.8z" />
                          </svg>
                        </div>

                        {/* Name */}
                        <div style={{
                          fontSize: '13px',
                          fontWeight: '600',
                          color: '#a78bfa',
                          marginBottom: '8px',
                        }}>
                          CinthiaMed IA
                        </div>

                        {/* Thinking Bubble */}
                        <div style={{
                          padding: '16px 20px',
                          borderRadius: '16px',
                          backgroundColor: '#2a3142',
                          border: '1px solid #3a4152',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                        }}>
                          <div style={{
                            display: 'flex',
                            gap: '4px',
                            alignItems: 'center',
                          }}>
                            <div style={{
                              width: '8px',
                              height: '8px',
                              borderRadius: '50%',
                              backgroundColor: '#8b5cf6',
                              animation: 'pulse 1.4s ease-in-out 0s infinite',
                            }} />
                            <div style={{
                              width: '8px',
                              height: '8px',
                              borderRadius: '50%',
                              backgroundColor: '#8b5cf6',
                              animation: 'pulse 1.4s ease-in-out 0.2s infinite',
                            }} />
                            <div style={{
                              width: '8px',
                              height: '8px',
                              borderRadius: '50%',
                              backgroundColor: '#8b5cf6',
                              animation: 'pulse 1.4s ease-in-out 0.4s infinite',
                            }} />
                          </div>
                          <span style={{
                            fontSize: '14px',
                            color: '#94a3b8',
                            fontStyle: 'italic',
                          }}>
                            Analisando estudos científicos...
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}


            </div>

            {/* Input Area */}
            <div style={{
              padding: isMobile ? 'var(--spacing-md) var(--spacing-md) var(--spacing-lg)' : 'var(--spacing-md) var(--spacing-2xl) var(--spacing-2xl)',
              paddingRight: isMobile ? 'var(--spacing-md)' : 'var(--spacing-2xl)',
              position: 'relative',
              zIndex: 1,
              transition: 'padding-right 0.3s ease',
            }}>
              <div style={{
                width: '100%',
                maxWidth: 'var(--container-md)',
                margin: '0 auto',
              }}>
                {/* Input Box */}
                <div style={{
                  backgroundColor: 'var(--bg-elevated)',
                  borderRadius: 'var(--spacing-md)',
                  border: '1px solid var(--border-accent)',
                  padding: 'var(--spacing-md) var(--spacing-md)',
                  marginBottom: 'var(--spacing-md)',
                  boxShadow: '0 0.625rem 2.5rem rgba(0, 0, 0, 0.3)',
                }}>
                  <input
                    type="text"
                    placeholder={assistantPlaceholders[selectedAssistant] || 'Como posso lhe ajudar?'}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    style={{
                      width: '100%',
                      backgroundColor: 'transparent',
                      border: 'none',
                      outline: 'none',
                      color: 'var(--text-primary)',
                      fontSize: 'var(--font-md)',
                      fontFamily: "'Outfit', sans-serif",
                      minHeight: 'var(--touch-min)',
                    }}
                  />
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginTop: 'var(--spacing-md)',
                    paddingTop: 'var(--spacing-sm)',
                    borderTop: '1px solid var(--border-accent)',
                    flexWrap: isMobile ? 'wrap' : 'nowrap',
                    gap: 'var(--spacing-sm)',
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}>
                      <select
                        value={selectedAssistant}
                        onChange={(e) => setSelectedAssistant(e.target.value)}
                        style={{
                          backgroundColor: 'transparent',
                          border: 'none',
                          color: '#64748b',
                          fontSize: '14px',
                          cursor: 'pointer',
                          outline: 'none',
                          fontFamily: "'Outfit', sans-serif",
                        }}
                      >
                        <option value="Assistente Geral">Assistente Geral</option>
                        <option value="Calculadoras">Calculadora Conversacional</option>
                        <option value="Pediatria">Pediatria</option>
                      </select>
                      {selectedAssistant === 'Calculadoras' && (
                        <div style={{
                          width: '20px',
                          height: '20px',
                          borderRadius: '50%',
                          background: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <button
                      onClick={handleSendMessage}
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '10px',
                        background: inputValue.trim()
                          ? 'linear-gradient(135deg, #8b5cf6, #ec4899)'
                          : '#334155',
                        border: 'none',
                        cursor: inputValue.trim() ? 'pointer' : 'default',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s',
                        boxShadow: inputValue.trim()
                          ? '0 4px 15px rgba(139, 92, 246, 0.4)'
                          : 'none',
                      }}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                        <path d="M22 2L11 13M22 2L15 22L11 13L2 9L22 2Z" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Quick Actions */}
                <div style={{
                  display: 'flex',
                  gap: '12px',
                  flexWrap: 'wrap',
                  justifyContent: 'center',
                }}>
                  {quickActions.map((action, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setInputValue(action.prompt);
                        setSelectedAssistant(action.assistantType);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '10px 16px',
                        backgroundColor: '#1e293b',
                        border: '1px solid #334155',
                        borderRadius: '12px',
                        color: '#94a3b8',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        fontSize: '14px',
                        fontWeight: '500',
                        fontFamily: "'Outfit', sans-serif",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = '#8b5cf6';
                        e.currentTarget.style.backgroundColor = 'rgba(139, 92, 246, 0.1)';
                        e.currentTarget.style.transform = 'translateY(-2px)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = '#334155';
                        e.currentTarget.style.backgroundColor = '#1e293b';
                        e.currentTarget.style.transform = 'translateY(0)';
                      }}
                    >
                      <span style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        opacity: 0.9,
                      }}>
                        {action.icon}
                      </span>
                      {action.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </>
        ) : currentView === 'recording' ? (
          /* Recording Area */
          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: isMobile ? 'var(--spacing-md)' : 'var(--spacing-2xl) var(--spacing-md)',
            overflowY: 'auto',
            position: 'relative',
            zIndex: 1,
          }}>
            <div style={{
              width: '100%',
              maxWidth: 'var(--container-xl)',
            }}>
              {/* Header */}
              <div style={{
                textAlign: 'center',
                marginBottom: isMobile ? 'var(--spacing-lg)' : 'var(--spacing-2xl)',
              }}>
                <h1 style={{
                  fontSize: isMobile ? 'var(--font-2xl)' : 'var(--font-4xl)',
                  fontWeight: '600',
                  background: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  marginBottom: 'var(--spacing-sm)',
                }}>
                  Gravação de Consulta {!isMobile && 'Online'}
                </h1>
                <p style={{
                  fontSize: isMobile ? 'var(--font-sm)' : 'var(--font-md)',
                  color: 'var(--text-disabled)',
                  padding: isMobile ? '0 var(--spacing-xs)' : '0',
                }}>
                  Grave o áudio da consulta {!isMobile && 'online '}e a IA gera um prontuário completo
                </p>
              </div>

              {/* Main Content Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(min(100%, 400px), 1fr))',
                gap: isMobile ? 'var(--spacing-md)' : 'var(--spacing-lg)',
                marginBottom: isMobile ? 'var(--spacing-lg)' : 'var(--spacing-2xl)',
              }}>
                {/* Dados do Paciente */}
                <div style={{
                  backgroundColor: 'var(--bg-tertiary)',
                  borderRadius: 'var(--spacing-md)',
                  border: '1px solid var(--border-secondary)',
                  padding: isMobile ? 'var(--spacing-lg)' : 'var(--spacing-xl)',
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    marginBottom: '24px',
                  }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2">
                      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                    <h2 style={{
                      fontSize: '20px',
                      fontWeight: '600',
                      color: '#e2e8f0',
                      margin: 0,
                    }}>
                      Dados do Paciente
                    </h2>
                  </div>

                  <p style={{
                    fontSize: '14px',
                    color: '#64748b',
                    marginBottom: '24px',
                  }}>
                    Informações opcionais para contextualizar a análise
                  </p>

                  <div style={{ marginBottom: '20px' }}>
                    <label style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: '500',
                      color: '#94a3b8',
                      marginBottom: '8px',
                    }}>
                      Nome do Paciente
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: João Silva"
                      value={patientName}
                      onChange={(e) => setPatientName(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        backgroundColor: '#0f1419',
                        border: '1px solid #2a3142',
                        borderRadius: '12px',
                        color: '#e2e8f0',
                        fontSize: '15px',
                        outline: 'none',
                        fontFamily: "'Outfit', sans-serif",
                        transition: 'border-color 0.2s',
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#8b5cf6'}
                      onBlur={(e) => e.target.style.borderColor = '#2a3142'}
                    />
                  </div>

                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
                    gap: 'var(--spacing-md)',
                    marginBottom: 'var(--spacing-md)',
                  }}>
                    <div>
                      <label style={{
                        display: 'block',
                        fontSize: '14px',
                        fontWeight: '500',
                        color: '#94a3b8',
                        marginBottom: '8px',
                      }}>
                        Idade
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: 45 anos"
                        value={patientAge}
                        onChange={(e) => setPatientAge(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          backgroundColor: '#0f1419',
                          border: '1px solid #2a3142',
                          borderRadius: '12px',
                          color: '#e2e8f0',
                          fontSize: '15px',
                          outline: 'none',
                          fontFamily: "'Outfit', sans-serif",
                          transition: 'border-color 0.2s',
                        }}
                        onFocus={(e) => e.target.style.borderColor = '#8b5cf6'}
                        onBlur={(e) => e.target.style.borderColor = '#2a3142'}
                      />
                    </div>
                    <div>
                      <label style={{
                        display: 'block',
                        fontSize: '14px',
                        fontWeight: '500',
                        color: '#94a3b8',
                        marginBottom: '8px',
                      }}>
                        Sexo
                      </label>
                      <input
                        type="text"
                        placeholder="M / F"
                        value={patientGender}
                        onChange={(e) => setPatientGender(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          backgroundColor: '#0f1419',
                          border: '1px solid #2a3142',
                          borderRadius: '12px',
                          color: '#e2e8f0',
                          fontSize: '15px',
                          outline: 'none',
                          fontFamily: "'Outfit', sans-serif",
                          transition: 'border-color 0.2s',
                        }}
                        onFocus={(e) => e.target.style.borderColor = '#8b5cf6'}
                        onBlur={(e) => e.target.style.borderColor = '#2a3142'}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: '500',
                      color: '#64748b',
                      marginBottom: '8px',
                    }}>
                      Observações Clínicas
                    </label>
                    <textarea
                      placeholder="Informações adicionais relevantes (comorbidades, medicações em uso, etc.)..."
                      value={clinicalObservations}
                      onChange={(e) => setClinicalObservations(e.target.value)}
                      rows={4}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        backgroundColor: '#0f1419',
                        border: '1px solid #2a3142',
                        borderRadius: '12px',
                        color: '#e2e8f0',
                        fontSize: '15px',
                        outline: 'none',
                        fontFamily: "'Outfit', sans-serif",
                        resize: 'vertical',
                        transition: 'border-color 0.2s',
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#8b5cf6'}
                      onBlur={(e) => e.target.style.borderColor = '#2a3142'}
                    />
                  </div>
                </div>

                {/* Gravação de Áudio */}
                <div style={{
                  backgroundColor: '#1a1f2e',
                  borderRadius: '20px',
                  border: '1px solid #2a3142',
                  padding: '32px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    marginBottom: '24px',
                  }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ec4899" strokeWidth="2">
                      <path d="M12 1a3 3 0 003 3v8a3 3 0 11-6 0V4a3 3 0 003-3z" />
                      <path d="M19 10v2a7 7 0 01-14 0v-2" />
                      <line x1="12" y1="19" x2="12" y2="23" />
                      <line x1="8" y1="23" x2="16" y2="23" />
                    </svg>
                    <h2 style={{
                      fontSize: '20px',
                      fontWeight: '600',
                      color: '#e2e8f0',
                      margin: 0,
                    }}>
                      Gravação de Áudio
                    </h2>
                  </div>

                  <p style={{
                    fontSize: '14px',
                    color: '#64748b',
                    marginBottom: '40px',
                    textAlign: 'center',
                  }}>
                    Grave a consulta médica para análise clínica
                  </p>

                  {/* Timer Display */}
                  <div style={{
                    fontSize: isMobile ? '3rem' : '4rem',
                    fontWeight: '300',
                    color: 'var(--text-primary)',
                    marginBottom: isMobile ? 'var(--spacing-lg)' : 'var(--spacing-3xl)',
                    fontFamily: "'Outfit', monospace",
                    letterSpacing: isMobile ? '0.125rem' : '0.25rem',
                  }}>
                    {formatTime(recordingTime)}
                  </div>

                  {/* Record Button */}
                  <button
                    onClick={handleToggleRecording}
                    style={{
                      width: isMobile ? '5rem' : '7.5rem',
                      height: isMobile ? '5rem' : '7.5rem',
                      minWidth: 'var(--touch-min)',
                      minHeight: 'var(--touch-min)',
                      borderRadius: '50%',
                      background: isRecording
                        ? 'linear-gradient(135deg, #ef4444, #dc2626)'
                        : 'linear-gradient(135deg, #ec4899, #8b5cf6)',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.3s ease',
                      boxShadow: isRecording
                        ? '0 0 2.5rem rgba(239, 68, 68, 0.6)'
                        : '0 0.625rem 2.5rem rgba(236, 72, 153, 0.4)',
                      animation: isRecording ? 'pulse 2s ease-in-out infinite' : 'none',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'scale(1.05)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                  >
                    {isRecording ? (
                      <svg width={isMobile ? "32" : "48"} height={isMobile ? "32" : "48"} viewBox="0 0 24 24" fill="white">
                        <rect x="6" y="6" width="12" height="12" rx="2" />
                      </svg>
                    ) : (
                      <svg width={isMobile ? "32" : "48"} height={isMobile ? "32" : "48"} viewBox="0 0 24 24" fill="white">
                        <circle cx="12" cy="12" r="10" />
                      </svg>
                    )}
                  </button>

                  <p style={{
                    fontSize: 'var(--font-base)',
                    fontWeight: '500',
                    color: isRecording ? 'var(--error)' : 'var(--accent-primary)',
                    marginTop: 'var(--spacing-lg)',
                  }}>
                    {isRecording ? 'Gravando...' : 'Pronto para gravar'}
                  </p>
                </div>
              </div>

              {/* Campo de Transcrição Manual */}
              <div style={{
                backgroundColor: '#1a1f2e',
                borderRadius: '20px',
                border: '1px solid #2a3142',
                padding: '32px',
                marginTop: '40px',
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  marginBottom: '16px',
                }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                  </svg>
                  <h3 style={{
                    fontSize: '18px',
                    fontWeight: '600',
                    color: '#e2e8f0',
                    margin: 0,
                  }}>
                    Transcrição Manual (Opcional)
                  </h3>
                </div>
                <p style={{
                  fontSize: '13px',
                  color: '#64748b',
                  marginBottom: '16px',
                }}>
                  Cole ou digite a transcrição da consulta caso não tenha gravado áudio
                </p>
                <textarea
                  placeholder="Ex: Paciente relata febre há 3 dias, tosse seca, cefaleia..."
                  value={manualTranscript}
                  onChange={(e) => setManualTranscript(e.target.value)}
                  rows={8}
                  style={{
                    width: '100%',
                    padding: '16px',
                    backgroundColor: '#0f1419',
                    border: '1px solid #2a3142',
                    borderRadius: '12px',
                    color: '#e2e8f0',
                    fontSize: '15px',
                    outline: 'none',
                    fontFamily: "'Outfit', sans-serif",
                    resize: 'vertical',
                    lineHeight: '1.6',
                    transition: 'border-color 0.2s',
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#8b5cf6'}
                  onBlur={(e) => e.target.style.borderColor = '#2a3142'}
                />
              </div>

              {/* Action Buttons */}
              <div style={{
                display: 'flex',
                gap: '16px',
                justifyContent: 'center',
                marginTop: '32px',
              }}>
                <button
                  style={{
                    padding: '16px 32px',
                    backgroundColor: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '12px',
                    color: '#e2e8f0',
                    fontSize: '15px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    fontFamily: "'Outfit', sans-serif",
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#334155';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#1e293b';
                  }}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleGenerateReport}
                  disabled={(!audioBlob && !manualTranscript.trim()) || isGeneratingReport}
                  style={{
                    padding: '16px 48px',
                    background: (audioBlob || manualTranscript.trim()) && !isGeneratingReport
                      ? 'linear-gradient(135deg, #8b5cf6, #ec4899)'
                      : '#334155',
                    border: 'none',
                    borderRadius: '12px',
                    color: 'white',
                    fontSize: '15px',
                    fontWeight: '600',
                    cursor: (audioBlob || manualTranscript.trim()) && !isGeneratingReport ? 'pointer' : 'not-allowed',
                    fontFamily: "'Outfit', sans-serif",
                    transition: 'all 0.2s',
                    boxShadow: (audioBlob || manualTranscript.trim()) && !isGeneratingReport
                      ? '0 4px 20px rgba(139, 92, 246, 0.4)'
                      : 'none',
                    opacity: (audioBlob || manualTranscript.trim()) && !isGeneratingReport ? 1 : 0.5,
                  }}
                  onMouseEnter={(e) => {
                    if ((audioBlob || manualTranscript.trim()) && !isGeneratingReport) {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 6px 25px rgba(139, 92, 246, 0.5)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if ((audioBlob || manualTranscript.trim()) && !isGeneratingReport) {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 4px 20px rgba(139, 92, 246, 0.4)';
                    }
                  }}
                >
                  {isGeneratingReport ? 'Transcrevendo e Gerando Prontuário...' : 'Gerar Prontuário Médico'}
                </button>
              </div>

              {/* SOAP Viewer */}
              {showSOAPViewer && currentSOAP && (
                <div style={{
                  marginTop: '40px',
                  width: '100%',
                  maxWidth: '1200px',
                }}>
                  <SOAPViewer
                    soapData={currentSOAP}
                    patientData={{
                      nome: patientName,
                      idade: patientAge,
                      sexo: patientGender
                    }}
                    onExportTypeSelect={(type) => {
                      console.log('Gerar documento tipo:', type);
                      showToastMessage(`Funcionalidade de ${type} será implementada em breve!`);
                    }}
                  />
                </div>
              )}

              {/* Área do Relatório Clínico */}
              {clinicalReport && !showSOAPViewer && (
                <div style={{
                  marginTop: '40px',
                  width: '100%',
                  maxWidth: '1200px',
                }}>
                  <div style={{
                    backgroundColor: '#1a1f2e',
                    borderRadius: '20px',
                    border: '1px solid #2a3142',
                    padding: '32px',
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '24px',
                    }}>
                      <h3 style={{
                        fontSize: '20px',
                        fontWeight: '600',
                        color: '#e2e8f0',
                        margin: 0,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                      }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2">
                          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                          <polyline points="14 2 14 8 20 8" />
                          <line x1="16" y1="13" x2="8" y2="13" />
                          <line x1="16" y1="17" x2="8" y2="17" />
                          <polyline points="10 9 9 9 8 9" />
                        </svg>
                        Prontuário Médico
                      </h3>
                      <div style={{ display: 'flex', gap: '12px' }}>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(clinicalReport);
                            showToastMessage('Relatório copiado para a área de transferência!');
                          }}
                          style={{
                            padding: '8px 16px',
                            backgroundColor: '#8b5cf6',
                            border: 'none',
                            borderRadius: '8px',
                            color: 'white',
                            fontSize: '14px',
                            fontWeight: '500',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            fontFamily: "'Outfit', sans-serif",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#a78bfa';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = '#8b5cf6';
                          }}
                        >
                          📋 Copiar Relatório
                        </button>
                        <button
                          onClick={handleNewReport}
                          style={{
                            padding: '8px 16px',
                            backgroundColor: '#10b981',
                            border: 'none',
                            borderRadius: '8px',
                            color: 'white',
                            fontSize: '14px',
                            fontWeight: '500',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            fontFamily: "'Outfit', sans-serif",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#34d399';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = '#10b981';
                          }}
                        >
                          ✨ Gerar Novo Relatório
                        </button>
                      </div>
                    </div>

                    <div style={{
                      backgroundColor: '#0f1419',
                      borderRadius: '12px',
                      padding: '24px',
                      color: '#e2e8f0',
                      fontSize: '15px',
                      lineHeight: '1.8',
                      whiteSpace: 'pre-wrap',
                      fontFamily: "'Outfit', sans-serif",
                    }}>
                      {clinicalReport}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

        ) : currentView === 'exam-reader' ? (
          /* Exam Reader View */
          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            overflowY: 'auto',
            padding: '20px',
            position: 'relative',
            zIndex: 1,
          }}>
            <ExamReader
              onAnalysisComplete={(result) => {
                // Adicionar resultado ao chat
                const analysisMessage = `📋 **Análise de Exame Concluída**\n\n` +
                  `**Tipo:** ${result.examType || 'Não identificado'}\n\n` +
                  `**Resumo:** ${result.summary || 'Análise realizada com sucesso'}\n\n` +
                  `⚠️ **Importante:** Esta é uma análise auxiliada por IA e não substitui a interpretação de um médico.`;

                setMessages(prev => [...prev, {
                  role: 'assistant',
                  content: analysisMessage
                }]);

                // Voltar para o chat
                setCurrentView('chat');
                showToastMessage('Análise concluída! Resultado adicionado ao chat.');
              }}
            />
          </div>

        ) : currentView === 'scores' ? (
          /* Clinical Scores View */
          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            overflowY: 'auto',
            padding: '40px 20px',
            position: 'relative',
            zIndex: 1,
          }}>
            <div style={{
              width: '100%',
              maxWidth: selectedScore ? '900px' : '1400px',
              margin: '0 auto',
            }}>
              {!selectedScore ? (
                /* Scores List View */
                <>
                  {/* Header */}
                  <div style={{
                    textAlign: 'center',
                    marginBottom: '40px',
                  }}>
                    <h1 style={{
                      fontSize: '32px',
                      fontWeight: '600',
                      background: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      marginBottom: '12px',
                    }}>
                      Escores Clínicos
                    </h1>
                    <p style={{
                      fontSize: '16px',
                      color: '#64748b',
                    }}>
                      Mais de 50 escores validados para auxílio à decisão clínica
                    </p>
                  </div>

                  {/* Search and Filter */}
                  <div style={{
                    display: 'flex',
                    gap: '16px',
                    marginBottom: '32px',
                    flexWrap: 'wrap',
                  }}>
                    <input
                      type="text"
                      placeholder="Buscar escore..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      style={{
                        flex: 1,
                        minWidth: '300px',
                        padding: '14px 20px',
                        backgroundColor: '#1a1f2e',
                        border: '1px solid #2a3142',
                        borderRadius: '12px',
                        color: '#e2e8f0',
                        fontSize: '15px',
                        fontFamily: "'Outfit', sans-serif",
                        outline: 'none',
                      }}
                    />
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      style={{
                        padding: '14px 20px',
                        backgroundColor: '#1a1f2e',
                        border: '1px solid #2a3142',
                        borderRadius: '12px',
                        color: '#e2e8f0',
                        fontSize: '15px',
                        fontFamily: "'Outfit', sans-serif",
                        outline: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      <option value="Todos">Todas as Categorias</option>
                      <option value="Neurologia">Neurologia</option>
                      <option value="Cardiologia">Cardiologia</option>
                      <option value="Pneumologia">Pneumologia</option>
                      <option value="Gastroenterologia">Gastroenterologia</option>
                      <option value="Emergência">Emergência</option>
                      <option value="UTI">UTI</option>
                      <option value="Calculadoras Gerais">Calculadoras Gerais</option>
                      <option value="Psiquiatria">Psiquiatria</option>
                    </select>
                  </div>

                  {/* Scores Grid */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                    gap: '20px',
                  }}>
                    {filteredScores.length > 0 ? (
                      filteredScores.map((score, index) => (
                        <div
                          key={index}
                          onClick={() => setSelectedScore(score.name)}
                          style={{
                            backgroundColor: '#1a1f2e',
                            border: '1px solid #2a3142',
                            borderRadius: '16px',
                            padding: '24px',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = '#8b5cf6';
                            e.currentTarget.style.transform = 'translateY(-4px)';
                            e.currentTarget.style.boxShadow = '0 8px 24px rgba(139, 92, 246, 0.15)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = '#2a3142';
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = 'none';
                          }}
                        >
                          <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'flex-start',
                            marginBottom: '8px',
                          }}>
                            <h3 style={{
                              fontSize: '16px',
                              fontWeight: '600',
                              color: '#e2e8f0',
                              margin: 0,
                            }}>
                              {score.name}
                            </h3>
                            <span style={{
                              fontSize: '10px',
                              fontWeight: '600',
                              color: '#8b5cf6',
                              backgroundColor: 'rgba(139, 92, 246, 0.1)',
                              padding: '4px 8px',
                              borderRadius: '6px',
                              textTransform: 'uppercase',
                              letterSpacing: '0.5px',
                              whiteSpace: 'nowrap',
                              marginLeft: '8px',
                            }}>
                              {score.category}
                            </span>
                          </div>
                          <p style={{
                            fontSize: '13px',
                            color: '#64748b',
                            margin: 0,
                          }}>
                            {score.description}
                          </p>
                        </div>
                      ))
                    ) : (
                      <div style={{
                        gridColumn: '1 / -1',
                        textAlign: 'center',
                        padding: '40px',
                        color: '#64748b',
                      }}>
                        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ margin: '0 auto 16px', opacity: 0.3 }}>
                          <circle cx="11" cy="11" r="8" />
                          <path d="m21 21-4.35-4.35" />
                        </svg>
                        <p style={{ fontSize: '15px', margin: 0 }}>
                          Nenhum escore encontrado
                        </p>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                /* Score Detail View - Usar ScoreCalculator */
                <ScoreCalculator
                  scoreName={selectedScore}
                  onBack={() => {
                    setSelectedScore(null);
                    setScoreInputs({});
                    setScoreResult(null);
                  }}
                />
              )}
            </div>
          </div>
        ) : null}

        {/* Toast Notification */}
        {showToast && (
          <div style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            backgroundColor: '#1e293b',
            border: '1px solid #8b5cf6',
            borderRadius: '12px',
            padding: '16px 24px',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
            zIndex: 9999,
            animation: 'slideIn 0.3s ease-out',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            minWidth: '300px',
          }}>
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#8b5cf6"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
            <span style={{
              color: '#e2e8f0',
              fontSize: '14px',
              fontWeight: '500',
              fontFamily: "'Outfit', sans-serif",
            }}>
              {toastMessage}
            </span>
          </div>
        )}
      </main>


    </div>
  );
};

export default CinthiaMed;
