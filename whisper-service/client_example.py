"""
Exemplo de cliente Python para o CinthiaMed Voice Service
Demonstra como usar o serviço de transcrição de forma programática
"""

import requests
import sys
import time
from pathlib import Path


class VoiceClient:
    """Cliente para o CinthiaMed Voice Service"""

    def __init__(self, base_url="http://localhost:8000"):
        """
        Inicializa o cliente

        Args:
            base_url: URL base do serviço (ex: https://voice.cinthiamed.com.br)
        """
        self.base_url = base_url.rstrip('/')

    def health_check(self):
        """
        Verifica se o serviço está online

        Returns:
            dict: Status do serviço ou None se offline
        """
        try:
            response = requests.get(f"{self.base_url}/health", timeout=5)
            if response.status_code == 200:
                return response.json()
            return None
        except requests.exceptions.RequestException:
            return None

    def transcribe(self, audio_path, language="pt", initial_prompt=None):
        """
        Transcreve um arquivo de áudio completo

        Args:
            audio_path: Caminho para o arquivo de áudio
            language: Código do idioma (padrão: 'pt')
            initial_prompt: Prompt customizado (opcional)

        Returns:
            dict: Resultado da transcrição com texto e segmentos

        Raises:
            FileNotFoundError: Se o arquivo não existir
            requests.exceptions.RequestException: Se houver erro na requisição
        """
        audio_file = Path(audio_path)

        if not audio_file.exists():
            raise FileNotFoundError(f"Arquivo não encontrado: {audio_path}")

        # Preparar dados
        files = {'audio': open(audio_file, 'rb')}
        data = {'language': language}

        if initial_prompt:
            data['initial_prompt'] = initial_prompt

        try:
            # Enviar requisição
            response = requests.post(
                f"{self.base_url}/transcribe",
                files=files,
                data=data,
                timeout=300  # 5 minutos
            )

            response.raise_for_status()
            return response.json()

        finally:
            files['audio'].close()

    def transcribe_streaming(self, audio_path, language="pt"):
        """
        Transcrição rápida (apenas texto final, sem segmentos)

        Args:
            audio_path: Caminho para o arquivo de áudio
            language: Código do idioma

        Returns:
            str: Texto transcrito

        Raises:
            FileNotFoundError: Se o arquivo não existir
            requests.exceptions.RequestException: Se houver erro na requisição
        """
        audio_file = Path(audio_path)

        if not audio_file.exists():
            raise FileNotFoundError(f"Arquivo não encontrado: {audio_path}")

        files = {'audio': open(audio_file, 'rb')}
        data = {'language': language}

        try:
            response = requests.post(
                f"{self.base_url}/transcribe-streaming",
                files=files,
                data=data,
                timeout=300
            )

            response.raise_for_status()
            result = response.json()
            return result.get('text', '')

        finally:
            files['audio'].close()


def example_basic_usage():
    """Exemplo 1: Uso básico"""
    print("=" * 60)
    print("EXEMPLO 1: Uso Básico")
    print("=" * 60)

    # Criar cliente
    client = VoiceClient("http://localhost:8000")

    # Verificar se está online
    health = client.health_check()
    if not health:
        print("❌ Serviço offline!")
        return

    print(f"✅ Serviço online - Modelo: {health['model']}")

    # Transcrever (substitua pelo caminho real do seu áudio)
    audio_file = "test_audio.mp3"

    if not Path(audio_file).exists():
        print(f"⚠️  Arquivo não encontrado: {audio_file}")
        print("   Crie um arquivo de teste ou use um caminho válido")
        return

    print(f"\n🎤 Transcrevendo: {audio_file}")

    try:
        result = client.transcribe(audio_file)

        print(f"\n📝 Texto: {result['text']}")
        print(f"\n📊 Metadados:")
        print(f"   Idioma: {result['metadata']['language']}")
        print(f"   Confiança: {result['metadata']['language_probability']:.1%}")
        print(f"   Duração: {result['metadata']['duration']:.2f}s")
        print(f"   Segmentos: {len(result['segments'])}")

    except Exception as e:
        print(f"❌ Erro: {e}")


def example_medical_context():
    """Exemplo 2: Contexto médico com prompt customizado"""
    print("\n" + "=" * 60)
    print("EXEMPLO 2: Contexto Médico com Prompt")
    print("=" * 60)

    client = VoiceClient("http://localhost:8000")

    audio_file = "consulta_medica.mp3"

    if not Path(audio_file).exists():
        print(f"⚠️  Arquivo não encontrado: {audio_file}")
        return

    # Prompt específico para anamnese
    medical_prompt = """
    Transcrição de anamnese médica.
    Termos comuns: paciente, sintomas, diagnóstico, tratamento, prescrição,
    hipertensão, diabetes, cefaleia, dispneia, náuseas, vômitos,
    hemograma, raio-x, ultrassom, tomografia, ressonância magnética,
    amoxicilina, paracetamol, ibuprofeno, omeprazol, losartana, metformina.
    """

    print(f"🎤 Transcrevendo com contexto médico...")

    try:
        result = client.transcribe(
            audio_file,
            language="pt",
            initial_prompt=medical_prompt
        )

        print(f"\n📋 ANAMNESE TRANSCRITA:")
        print("-" * 60)
        print(result['text'])
        print("-" * 60)

        # Mostrar segmentos com timestamps
        print(f"\n⏱️  SEGMENTOS:")
        for seg in result['segments'][:5]:  # Primeiros 5 segmentos
            print(f"  [{seg['start']:.1f}s - {seg['end']:.1f}s] {seg['text']}")

    except Exception as e:
        print(f"❌ Erro: {e}")


def example_batch_processing():
    """Exemplo 3: Processar múltiplos arquivos"""
    print("\n" + "=" * 60)
    print("EXEMPLO 3: Processamento em Lote")
    print("=" * 60)

    client = VoiceClient("http://localhost:8000")

    # Lista de arquivos para processar
    audio_files = [
        "paciente_1.mp3",
        "paciente_2.mp3",
        "paciente_3.mp3",
    ]

    results = []

    for audio_file in audio_files:
        if not Path(audio_file).exists():
            print(f"⚠️  Ignorando: {audio_file} (não encontrado)")
            continue

        print(f"\n🎤 Processando: {audio_file}")

        try:
            start_time = time.time()

            # Usar versão rápida (streaming) para lote
            text = client.transcribe_streaming(audio_file)

            elapsed = time.time() - start_time

            results.append({
                'file': audio_file,
                'text': text,
                'time': elapsed
            })

            print(f"   ✅ Concluído em {elapsed:.2f}s")
            print(f"   📝 Texto: {text[:100]}...")  # Primeiros 100 caracteres

        except Exception as e:
            print(f"   ❌ Erro: {e}")

    # Resumo
    print(f"\n📊 RESUMO:")
    print(f"   Total processado: {len(results)}/{len(audio_files)}")
    if results:
        avg_time = sum(r['time'] for r in results) / len(results)
        print(f"   Tempo médio: {avg_time:.2f}s")


def example_error_handling():
    """Exemplo 4: Tratamento de erros"""
    print("\n" + "=" * 60)
    print("EXEMPLO 4: Tratamento de Erros")
    print("=" * 60)

    client = VoiceClient("http://localhost:8000")

    # Tentar diferentes cenários de erro

    # 1. Arquivo inexistente
    print("\n1️⃣ Testando arquivo inexistente...")
    try:
        client.transcribe("nao_existe.mp3")
    except FileNotFoundError as e:
        print(f"   ✅ Capturado: {e}")

    # 2. Serviço offline
    print("\n2️⃣ Testando serviço offline...")
    offline_client = VoiceClient("http://localhost:9999")
    health = offline_client.health_check()
    if health is None:
        print(f"   ✅ Detectado: Serviço offline")

    # 3. Arquivo muito grande
    print("\n3️⃣ Testando arquivo grande...")
    print("   (Implementação: verificar tamanho antes de enviar)")

    # 4. Timeout
    print("\n4️⃣ Testando timeout...")
    print("   (Configure timeout apropriado para áudios longos)")


def interactive_mode():
    """Modo interativo para testes"""
    print("=" * 60)
    print("🎤 CinthiaMed Voice Service - Cliente Interativo")
    print("=" * 60)

    # URL do serviço
    base_url = input("\n🌐 URL do serviço [http://localhost:8000]: ").strip()
    if not base_url:
        base_url = "http://localhost:8000"

    client = VoiceClient(base_url)

    # Verificar conexão
    print(f"\n🔍 Verificando conexão com {base_url}...")
    health = client.health_check()

    if not health:
        print("❌ Não foi possível conectar ao serviço!")
        print("   Certifique-se que o serviço está rodando.")
        return

    print(f"✅ Conectado!")
    print(f"   Modelo: {health['model']}")
    print(f"   Device: {health['device']}")

    # Loop de transcrição
    while True:
        print("\n" + "-" * 60)
        audio_path = input("\n📁 Caminho do áudio (ou 'q' para sair): ").strip()

        if audio_path.lower() in ['q', 'quit', 'exit', 'sair']:
            print("👋 Até logo!")
            break

        if not audio_path:
            continue

        if not Path(audio_path).exists():
            print(f"❌ Arquivo não encontrado: {audio_path}")
            continue

        language = input("🌍 Idioma [pt]: ").strip() or "pt"

        print(f"\n⏳ Processando...")
        start_time = time.time()

        try:
            result = client.transcribe(audio_path, language=language)
            elapsed = time.time() - start_time

            print(f"\n✅ Concluído em {elapsed:.2f}s")
            print("\n" + "=" * 60)
            print("TRANSCRIÇÃO:")
            print("=" * 60)
            print(result['text'])
            print("=" * 60)

            print(f"\n📊 Metadados:")
            print(f"   Idioma: {result['metadata']['language']} "
                  f"({result['metadata']['language_probability']:.1%})")
            print(f"   Duração: {result['metadata']['duration']:.2f}s")
            print(f"   Segmentos: {len(result['segments'])}")

            # Perguntar se quer ver segmentos
            show_segments = input("\n👁️  Ver segmentos detalhados? [s/N]: ").strip().lower()
            if show_segments in ['s', 'sim', 'y', 'yes']:
                print("\n⏱️  SEGMENTOS:")
                for i, seg in enumerate(result['segments'], 1):
                    print(f"  {i}. [{seg['start']:.2f}s - {seg['end']:.2f}s] {seg['text']}")

        except Exception as e:
            print(f"\n❌ Erro: {e}")


def main():
    """Função principal"""
    if len(sys.argv) > 1:
        command = sys.argv[1].lower()

        if command == "interactive":
            interactive_mode()
        elif command == "example1":
            example_basic_usage()
        elif command == "example2":
            example_medical_context()
        elif command == "example3":
            example_batch_processing()
        elif command == "example4":
            example_error_handling()
        else:
            print(f"Comando desconhecido: {command}")
            print_usage()
    else:
        # Executar todos os exemplos
        print("🏥 CinthiaMed Voice Service - Exemplos de Uso\n")
        example_basic_usage()
        # example_medical_context()
        # example_batch_processing()
        example_error_handling()


def print_usage():
    """Mostra instruções de uso"""
    print("""
Uso: python client_example.py [comando]

Comandos:
    interactive     Modo interativo para testar transcrições
    example1        Exemplo básico de transcrição
    example2        Exemplo com contexto médico
    example3        Processamento em lote
    example4        Tratamento de erros

Sem argumentos: executa exemplos básicos

Exemplos:
    python client_example.py interactive
    python client_example.py example1
    """)


if __name__ == "__main__":
    main()
