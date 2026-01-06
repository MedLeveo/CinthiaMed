# 🎤 Integração do Frontend com o Serviço de Voz

Este guia mostra como integrar o sistema de transcrição de voz no frontend React do CinthiaMed.

---

## 📋 Configuração Inicial

### 1. Adicionar variável de ambiente

Crie ou edite o arquivo `.env` no root do projeto React:

```env
# URL do serviço de voz na VPS
REACT_APP_VOICE_SERVICE_URL=https://voice.cinthiamed.com.br
# ou durante desenvolvimento:
# REACT_APP_VOICE_SERVICE_URL=http://localhost:8000
```

---

## 🎯 Componente de Gravação de Áudio

Crie o arquivo `src/components/VoiceRecorder.jsx`:

```jsx
import React, { useState, useRef } from 'react';
import './VoiceRecorder.css';

const VoiceRecorder = ({ onTranscription }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);

  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  // Iniciar gravação
  const startRecording = async () => {
    try {
      setError(null);

      // Solicitar permissão do microfone
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000, // Whisper funciona bem com 16kHz
          echoCancellation: true,
          noiseSuppression: true,
        }
      });

      // Configurar MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      // Coletar chunks de áudio
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      // Quando parar a gravação
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        await sendAudioForTranscription(audioBlob);

        // Parar todas as tracks
        stream.getTracks().forEach(track => track.stop());
      };

      // Iniciar gravação
      mediaRecorder.start();
      setIsRecording(true);

    } catch (err) {
      console.error('Erro ao iniciar gravação:', err);
      setError('Não foi possível acessar o microfone. Verifique as permissões.');
    }
  };

  // Parar gravação
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // Enviar áudio para transcrição
  const sendAudioForTranscription = async (audioBlob) => {
    setIsProcessing(true);
    setError(null);

    try {
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

      if (!response.ok) {
        throw new Error(`Erro na transcrição: ${response.status}`);
      }

      const result = await response.json();

      // Callback com o texto transcrito
      if (onTranscription) {
        onTranscription(result.text);
      }

    } catch (err) {
      console.error('Erro na transcrição:', err);
      setError('Erro ao processar o áudio. Tente novamente.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="voice-recorder">
      <button
        className={`voice-button ${isRecording ? 'recording' : ''}`}
        onClick={isRecording ? stopRecording : startRecording}
        disabled={isProcessing}
      >
        {isProcessing ? (
          <>
            <span className="spinner"></span>
            Processando...
          </>
        ) : isRecording ? (
          <>
            <span className="recording-indicator"></span>
            Parar Gravação
          </>
        ) : (
          <>
            <span className="mic-icon">🎤</span>
            Gravar Áudio
          </>
        )}
      </button>

      {error && (
        <div className="error-message">
          ⚠️ {error}
        </div>
      )}
    </div>
  );
};

export default VoiceRecorder;
```

---

## 🎨 CSS do Componente

Crie `src/components/VoiceRecorder.css`:

```css
.voice-recorder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.voice-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem 2rem;
  font-size: 1rem;
  font-weight: 600;
  border: none;
  border-radius: 50px;
  cursor: pointer;
  transition: all 0.3s ease;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
}

.voice-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.6);
}

.voice-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.voice-button.recording {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    box-shadow: 0 4px 15px rgba(245, 87, 108, 0.4);
  }
  50% {
    box-shadow: 0 6px 25px rgba(245, 87, 108, 0.8);
  }
}

.recording-indicator {
  width: 12px;
  height: 12px;
  background-color: #ff4444;
  border-radius: 50%;
  animation: blink 1s ease-in-out infinite;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}

.spinner {
  width: 16px;
  height: 16px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.mic-icon {
  font-size: 1.2rem;
}

.error-message {
  padding: 0.75rem 1.5rem;
  background-color: #fee;
  color: #c33;
  border-radius: 8px;
  font-size: 0.9rem;
  text-align: center;
}
```

---

## 🔗 Integração no Chat

Exemplo de como usar no componente de chat principal:

```jsx
import React, { useState } from 'react';
import VoiceRecorder from './components/VoiceRecorder';

function ChatPage() {
  const [message, setMessage] = useState('');

  // Callback quando a transcrição estiver pronta
  const handleTranscription = (text) => {
    console.log('Texto transcrito:', text);

    // Adicionar o texto transcrito ao input
    setMessage(prevMessage => prevMessage + ' ' + text);

    // OU enviar automaticamente para a IA
    // sendMessageToAI(text);
  };

  return (
    <div className="chat-container">
      {/* ... resto do chat ... */}

      <div className="input-area">
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Digite sua mensagem ou use o botão de voz..."
        />

        <div className="actions">
          <VoiceRecorder onTranscription={handleTranscription} />

          <button onClick={() => sendMessage(message)}>
            Enviar
          </button>
        </div>
      </div>
    </div>
  );
}

export default ChatPage;
```

---

## 🎯 Versão Simplificada (Apenas Texto)

Se você quer apenas pegar o texto sem componente visual:

```jsx
// Função utilitária para transcrever áudio
export async function transcribeAudio(audioBlob) {
  const formData = new FormData();
  formData.append('audio', audioBlob, 'recording.webm');
  formData.append('language', 'pt');

  const response = await fetch(
    `${process.env.REACT_APP_VOICE_SERVICE_URL}/transcribe-streaming`,
    {
      method: 'POST',
      body: formData,
    }
  );

  if (!response.ok) {
    throw new Error(`Transcrição falhou: ${response.status}`);
  }

  const result = await response.json();
  return result.text;
}

// Uso:
const text = await transcribeAudio(audioBlob);
console.log('Transcrição:', text);
```

---

## 🚀 Uso Avançado: Upload de Arquivo

Para permitir que o usuário envie um arquivo de áudio gravado:

```jsx
const FileUploadTranscriber = ({ onTranscription }) => {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Verificar tamanho (máx 25MB)
    if (file.size > 25 * 1024 * 1024) {
      alert('Arquivo muito grande! Máximo: 25MB');
      return;
    }

    setIsProcessing(true);

    try {
      const formData = new FormData();
      formData.append('audio', file);
      formData.append('language', 'pt');

      const response = await fetch(
        `${process.env.REACT_APP_VOICE_SERVICE_URL}/transcribe`,
        {
          method: 'POST',
          body: formData,
        }
      );

      const result = await response.json();
      onTranscription(result.text);

    } catch (error) {
      console.error('Erro:', error);
      alert('Erro ao processar áudio');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div>
      <input
        type="file"
        accept="audio/*"
        onChange={handleFileUpload}
        disabled={isProcessing}
        style={{ display: 'none' }}
        id="audio-upload"
      />
      <label htmlFor="audio-upload" className="upload-button">
        {isProcessing ? 'Processando...' : '📎 Upload de Áudio'}
      </label>
    </div>
  );
};
```

---

## 🔐 Tratamento de Erros

Sempre adicione tratamento de erros adequado:

```jsx
const handleTranscriptionWithErrorHandling = async (audioBlob) => {
  try {
    const response = await fetch(
      `${process.env.REACT_APP_VOICE_SERVICE_URL}/transcribe`,
      {
        method: 'POST',
        body: formData,
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Erro desconhecido');
    }

    const result = await response.json();
    return result.text;

  } catch (error) {
    // Tratar diferentes tipos de erro
    if (error.message.includes('Failed to fetch')) {
      alert('Serviço de voz está offline. Tente novamente mais tarde.');
    } else if (error.message.includes('muito grande')) {
      alert('Áudio muito longo. Grave menos de 2 minutos.');
    } else {
      alert(`Erro na transcrição: ${error.message}`);
    }

    throw error;
  }
};
```

---

## 📱 Suporte Mobile

O código acima funciona em mobile! Apenas certifique-se:

1. **HTTPS obrigatório**: Navegadores mobile exigem HTTPS para acessar microfone
2. **Permissões**: O usuário precisará aceitar permissão do microfone
3. **Tamanho do botão**: Use tamanhos maiores de botão para touch

```css
@media (max-width: 768px) {
  .voice-button {
    padding: 1.2rem 2.5rem;
    font-size: 1.1rem;
  }
}
```

---

## 🎯 Próximos Passos

1. **Feedback visual**: Mostre forma de onda durante gravação
2. **Síntese de voz (TTS)**: Ler respostas da IA em voz alta
3. **Histórico**: Salvar transcrições para consulta
4. **Offline**: Implementar fallback quando serviço estiver offline

---

## 💡 Dicas de UX

- **Instruções claras**: Mostre ao usuário que ele pode usar voz
- **Feedback imediato**: Indique quando está gravando/processando
- **Fallback**: Sempre deixe opção de digitar manualmente
- **Privacidade**: Informe que o áudio é processado na sua VPS

---

**Desenvolvido para CinthiaMed** 🏥
