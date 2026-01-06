"""
Script de teste para verificar se o serviço de transcrição está funcionando
Execute: python test_transcription.py
"""

import requests
import sys
from pathlib import Path

# URL do serviço (ajuste conforme necessário)
BASE_URL = "http://localhost:8000"

def test_health():
    """Testa se o serviço está online"""
    print("🔍 Testando health check...")
    try:
        response = requests.get(f"{BASE_URL}/health")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Serviço online!")
            print(f"   Modelo: {data.get('model')}")
            print(f"   Device: {data.get('device')}")
            return True
        else:
            print(f"❌ Serviço retornou status {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print(f"❌ Não foi possível conectar em {BASE_URL}")
        print("   Certifique-se que o serviço está rodando: python app.py")
        return False
    except Exception as e:
        print(f"❌ Erro: {e}")
        return False


def test_transcription(audio_file_path=None):
    """Testa a transcrição de áudio"""
    print("\n🎤 Testando transcrição de áudio...")

    if audio_file_path is None:
        print("⚠️  Nenhum arquivo de áudio fornecido para teste")
        print("   Execute: python test_transcription.py caminho/para/audio.mp3")
        return False

    audio_path = Path(audio_file_path)

    if not audio_path.exists():
        print(f"❌ Arquivo não encontrado: {audio_file_path}")
        return False

    print(f"📁 Arquivo: {audio_path.name} ({audio_path.stat().st_size / 1024:.2f} KB)")

    try:
        with open(audio_path, 'rb') as audio_file:
            files = {'audio': audio_file}
            data = {'language': 'pt'}

            print("⏳ Enviando para transcrição...")
            response = requests.post(
                f"{BASE_URL}/transcribe",
                files=files,
                data=data,
                timeout=120  # 2 minutos de timeout
            )

        if response.status_code == 200:
            result = response.json()
            print("\n✅ Transcrição concluída!")
            print("\n" + "="*60)
            print("TEXTO TRANSCRITO:")
            print("="*60)
            print(result['text'])
            print("="*60)
            print(f"\nMetadados:")
            print(f"  - Idioma detectado: {result['metadata']['language']} "
                  f"({result['metadata']['language_probability']:.1%} confiança)")
            print(f"  - Duração: {result['metadata']['duration']:.2f}s")
            print(f"  - Segmentos: {len(result['segments'])}")

            if result['segments']:
                print(f"\n📊 Primeiros segmentos:")
                for i, seg in enumerate(result['segments'][:3]):
                    print(f"  [{seg['start']:.2f}s - {seg['end']:.2f}s] {seg['text']}")
                if len(result['segments']) > 3:
                    print(f"  ... e mais {len(result['segments']) - 3} segmentos")

            return True
        else:
            print(f"❌ Erro na transcrição: {response.status_code}")
            try:
                error_detail = response.json()
                print(f"   Detalhes: {error_detail}")
            except:
                print(f"   Resposta: {response.text}")
            return False

    except requests.exceptions.Timeout:
        print("❌ Timeout: o áudio demorou muito para processar")
        print("   Tente um arquivo menor ou aumente o timeout")
        return False
    except Exception as e:
        print(f"❌ Erro: {e}")
        return False


def main():
    print("🏥 CinthiaMed Voice Service - Teste de Transcrição\n")

    # Teste 1: Health Check
    if not test_health():
        sys.exit(1)

    # Teste 2: Transcrição (se arquivo fornecido)
    audio_file = sys.argv[1] if len(sys.argv) > 1 else None
    if audio_file:
        if not test_transcription(audio_file):
            sys.exit(1)

    print("\n✅ Todos os testes passaram!")


if __name__ == "__main__":
    main()
