"""
CinthiaMed - Serviço de Transcrição de Voz
Utiliza Faster Whisper para transcrição otimizada de áudio médico
"""

from fastapi import FastAPI, File, UploadFile, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from faster_whisper import WhisperModel
import tempfile
import os
import logging
from typing import Optional
import uvicorn

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Inicializar FastAPI
app = FastAPI(
    title="CinthiaMed Voice Service",
    description="Serviço de transcrição de voz médica usando Faster Whisper",
    version="1.0.0"
)

# Configurar CORS para permitir requisições do frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://cinthiamed.vercel.app",
        "http://localhost:3000",
        "http://localhost:5173",
        # Adicione o domínio do seu frontend em produção
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Inicializar o modelo Whisper
# Modelos disponíveis: tiny, base, small, medium, large-v2, large-v3
# Para VPS com recursos limitados, recomendo 'base' ou 'small'
MODEL_SIZE = os.getenv("WHISPER_MODEL_SIZE", "base")
DEVICE = "cpu"  # Use "cuda" se tiver GPU na VPS
COMPUTE_TYPE = "int8"  # Otimização para CPU

logger.info(f"Carregando modelo Whisper: {MODEL_SIZE}")
try:
    model = WhisperModel(
        MODEL_SIZE,
        device=DEVICE,
        compute_type=COMPUTE_TYPE,
        download_root="./models"  # Cache dos modelos
    )
    logger.info("Modelo Whisper carregado com sucesso!")
except Exception as e:
    logger.error(f"Erro ao carregar modelo: {e}")
    model = None


@app.get("/")
async def root():
    """Endpoint de health check"""
    return {
        "service": "CinthiaMed Voice Service",
        "status": "online",
        "model": MODEL_SIZE,
        "model_loaded": model is not None
    }


@app.get("/health")
async def health_check():
    """Verificação de saúde do serviço"""
    if model is None:
        raise HTTPException(status_code=503, detail="Modelo Whisper não carregado")

    return {
        "status": "healthy",
        "model": MODEL_SIZE,
        "device": DEVICE
    }


@app.post("/transcribe")
async def transcribe_audio(
    audio: UploadFile = File(...),
    language: Optional[str] = Form("pt"),
    initial_prompt: Optional[str] = Form(None)
):
    """
    Transcreve áudio em texto usando Faster Whisper

    Args:
        audio: Arquivo de áudio (formatos suportados: mp3, wav, m4a, ogg, webm)
        language: Código do idioma (padrão: 'pt' para português)
        initial_prompt: Prompt inicial para guiar a transcrição (opcional)

    Returns:
        JSON com o texto transcrito e metadados
    """

    if model is None:
        raise HTTPException(
            status_code=503,
            detail="Serviço indisponível: modelo não carregado"
        )

    # Verificar tipo de arquivo
    allowed_types = ["audio/mpeg", "audio/wav", "audio/mp4", "audio/ogg", "audio/webm"]
    if audio.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail=f"Tipo de arquivo não suportado: {audio.content_type}"
        )

    # Verificar tamanho (máximo 25MB, limite do Whisper OpenAI)
    content = await audio.read()
    file_size_mb = len(content) / (1024 * 1024)

    if file_size_mb > 25:
        raise HTTPException(
            status_code=400,
            detail=f"Arquivo muito grande: {file_size_mb:.2f}MB (máximo: 25MB)"
        )

    logger.info(f"Recebido áudio: {audio.filename} ({file_size_mb:.2f}MB)")

    # Salvar temporariamente
    temp_file = None
    try:
        # Criar arquivo temporário
        suffix = os.path.splitext(audio.filename)[1] if audio.filename else ".webm"
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as temp_file:
            temp_file.write(content)
            temp_file_path = temp_file.name

        logger.info(f"Processando transcrição: {temp_file_path}")

        # Prompt médico otimizado para melhor reconhecimento
        medical_prompt = initial_prompt or (
            "Este é um atendimento médico. "
            "Termos médicos comuns: paciente, sintomas, diagnóstico, prescrição, "
            "hipertensão, diabetes, cefaleia, dispneia, febre, dor, exame, "
            "hemograma, raio-x, ultrassom, tomografia, ressonância, "
            "amoxicilina, paracetamol, ibuprofeno, losartana, metformina."
        )

        # Transcrever usando Faster Whisper
        segments, info = model.transcribe(
            temp_file_path,
            language=language,
            initial_prompt=medical_prompt,
            beam_size=5,  # Qualidade da transcrição (5 é um bom balanço)
            vad_filter=True,  # Filtro de detecção de atividade de voz
            vad_parameters=dict(
                min_silence_duration_ms=500  # Mínimo de silêncio para separar segmentos
            )
        )

        # Extrair texto completo e segmentos
        full_text = ""
        segments_list = []

        for segment in segments:
            full_text += segment.text
            segments_list.append({
                "start": round(segment.start, 2),
                "end": round(segment.end, 2),
                "text": segment.text.strip()
            })

        logger.info(f"Transcrição concluída: {len(segments_list)} segmentos")

        return {
            "success": True,
            "text": full_text.strip(),
            "segments": segments_list,
            "metadata": {
                "language": info.language,
                "language_probability": round(info.language_probability, 3),
                "duration": round(info.duration, 2),
                "model": MODEL_SIZE
            }
        }

    except Exception as e:
        logger.error(f"Erro na transcrição: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Erro ao processar áudio: {str(e)}"
        )

    finally:
        # Limpar arquivo temporário
        if temp_file and os.path.exists(temp_file_path):
            try:
                os.unlink(temp_file_path)
                logger.info(f"Arquivo temporário removido: {temp_file_path}")
            except Exception as e:
                logger.warning(f"Erro ao remover arquivo temporário: {e}")


@app.post("/transcribe-streaming")
async def transcribe_streaming(
    audio: UploadFile = File(...),
    language: Optional[str] = Form("pt")
):
    """
    Transcreve áudio retornando apenas o texto final (mais rápido)
    Ideal para uso em tempo real onde os segmentos não são necessários
    """

    if model is None:
        raise HTTPException(
            status_code=503,
            detail="Serviço indisponível: modelo não carregado"
        )

    content = await audio.read()
    file_size_mb = len(content) / (1024 * 1024)

    if file_size_mb > 25:
        raise HTTPException(
            status_code=400,
            detail=f"Arquivo muito grande: {file_size_mb:.2f}MB"
        )

    temp_file = None
    try:
        suffix = os.path.splitext(audio.filename)[1] if audio.filename else ".webm"
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as temp_file:
            temp_file.write(content)
            temp_file_path = temp_file.name

        # Transcrição rápida sem segmentos
        segments, info = model.transcribe(
            temp_file_path,
            language=language,
            beam_size=3,  # Menor para velocidade
            vad_filter=True
        )

        # Apenas concatenar o texto
        text = "".join([segment.text for segment in segments]).strip()

        return {
            "success": True,
            "text": text,
            "language": info.language
        }

    except Exception as e:
        logger.error(f"Erro na transcrição: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

    finally:
        if temp_file and os.path.exists(temp_file_path):
            try:
                os.unlink(temp_file_path)
            except:
                pass


if __name__ == "__main__":
    # Rodar servidor
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(
        "app:app",
        host="0.0.0.0",
        port=port,
        reload=False  # True apenas em desenvolvimento
    )
