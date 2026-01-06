#!/bin/bash

# Script de gerenciamento do CinthiaMed Voice Service
# Execute: ./manage.sh [comando]

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Diretório do script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Nome do serviço systemd
SERVICE_NAME="cinthiamed-voice"

# Funções auxiliares
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Função: Instalar dependências
install() {
    print_info "Instalando dependências do CinthiaMed Voice Service..."

    # Verificar Python
    if ! command -v python3 &> /dev/null; then
        print_error "Python 3 não encontrado. Instale primeiro:"
        echo "  sudo apt install python3 python3-pip python3-venv"
        exit 1
    fi

    # Verificar FFmpeg
    if ! command -v ffmpeg &> /dev/null; then
        print_error "FFmpeg não encontrado. Instale primeiro:"
        echo "  sudo apt install ffmpeg"
        exit 1
    fi

    # Criar ambiente virtual
    if [ ! -d "venv" ]; then
        print_info "Criando ambiente virtual..."
        python3 -m venv venv
    fi

    # Ativar e instalar dependências
    print_info "Instalando pacotes Python..."
    source venv/bin/activate
    pip install --upgrade pip
    pip install -r requirements.txt

    # Copiar .env se não existir
    if [ ! -f ".env" ]; then
        print_info "Criando arquivo .env..."
        cp .env.example .env
        print_warning "Configure o arquivo .env conforme necessário"
    fi

    print_success "Instalação concluída!"
    print_info "Execute './manage.sh test' para testar"
}

# Função: Testar serviço
test() {
    print_info "Testando CinthiaMed Voice Service..."

    # Verificar se venv existe
    if [ ! -d "venv" ]; then
        print_error "Ambiente virtual não encontrado. Execute './manage.sh install' primeiro"
        exit 1
    fi

    source venv/bin/activate

    # Executar teste
    print_info "Iniciando servidor de teste (Ctrl+C para parar)..."
    python3 app.py
}

# Função: Testar health check
health() {
    print_info "Verificando saúde do serviço..."

    response=$(curl -s http://localhost:8000/health || echo "")

    if [ -z "$response" ]; then
        print_error "Serviço não está respondendo em http://localhost:8000"
        print_info "Verifique se o serviço está rodando: ./manage.sh status"
        exit 1
    fi

    echo "$response" | python3 -m json.tool
    print_success "Serviço está saudável!"
}

# Função: Instalar como serviço systemd
install_service() {
    print_info "Instalando como serviço systemd..."

    # Verificar se é root
    if [ "$EUID" -ne 0 ]; then
        print_error "Execute com sudo: sudo ./manage.sh install-service"
        exit 1
    fi

    # Criar arquivo de serviço
    SERVICE_FILE="/etc/systemd/system/${SERVICE_NAME}.service"

    print_info "Criando $SERVICE_FILE..."
    cat > "$SERVICE_FILE" << EOF
[Unit]
Description=CinthiaMed Voice Service (Faster Whisper)
After=network.target

[Service]
Type=simple
User=$SUDO_USER
WorkingDirectory=$SCRIPT_DIR
Environment="PATH=$SCRIPT_DIR/venv/bin"
ExecStart=$SCRIPT_DIR/venv/bin/python3 $SCRIPT_DIR/app.py
Restart=always
RestartSec=10

# Limites de recursos
MemoryLimit=2G
CPUQuota=80%

[Install]
WantedBy=multi-user.target
EOF

    # Recarregar systemd
    systemctl daemon-reload
    systemctl enable "$SERVICE_NAME"

    print_success "Serviço instalado!"
    print_info "Comandos disponíveis:"
    echo "  sudo systemctl start $SERVICE_NAME"
    echo "  sudo systemctl stop $SERVICE_NAME"
    echo "  sudo systemctl status $SERVICE_NAME"
    echo "  sudo journalctl -u $SERVICE_NAME -f"
}

# Função: Iniciar serviço
start() {
    print_info "Iniciando serviço..."
    sudo systemctl start "$SERVICE_NAME"
    sleep 2
    sudo systemctl status "$SERVICE_NAME" --no-pager
}

# Função: Parar serviço
stop() {
    print_info "Parando serviço..."
    sudo systemctl stop "$SERVICE_NAME"
    print_success "Serviço parado"
}

# Função: Reiniciar serviço
restart() {
    print_info "Reiniciando serviço..."
    sudo systemctl restart "$SERVICE_NAME"
    sleep 2
    sudo systemctl status "$SERVICE_NAME" --no-pager
}

# Função: Ver status
status() {
    sudo systemctl status "$SERVICE_NAME" --no-pager
}

# Função: Ver logs
logs() {
    print_info "Logs do serviço (Ctrl+C para sair)..."
    sudo journalctl -u "$SERVICE_NAME" -f --lines=100
}

# Função: Download manual do modelo
download_model() {
    MODEL_SIZE=${1:-base}
    print_info "Baixando modelo Whisper: $MODEL_SIZE..."

    if [ ! -d "venv" ]; then
        print_error "Execute './manage.sh install' primeiro"
        exit 1
    fi

    source venv/bin/activate

    python3 << EOF
from faster_whisper import WhisperModel
print("Baixando modelo $MODEL_SIZE...")
model = WhisperModel("$MODEL_SIZE", download_root="./models")
print("Modelo baixado com sucesso!")
EOF

    print_success "Modelo $MODEL_SIZE baixado!"
}

# Função: Limpar cache e arquivos temporários
clean() {
    print_info "Limpando arquivos temporários..."

    rm -rf __pycache__
    rm -f *.pyc
    rm -rf temp/
    rm -rf tmp/
    find . -name "*.tmp" -delete

    print_success "Limpeza concluída"
}

# Função: Desinstalar completamente
uninstall() {
    print_warning "Isso vai remover o ambiente virtual e o serviço systemd"
    read -p "Tem certeza? (y/N) " -n 1 -r
    echo

    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_info "Cancelado"
        exit 0
    fi

    # Parar e remover serviço
    if systemctl is-active --quiet "$SERVICE_NAME"; then
        sudo systemctl stop "$SERVICE_NAME"
    fi

    if systemctl is-enabled --quiet "$SERVICE_NAME"; then
        sudo systemctl disable "$SERVICE_NAME"
    fi

    if [ -f "/etc/systemd/system/${SERVICE_NAME}.service" ]; then
        sudo rm "/etc/systemd/system/${SERVICE_NAME}.service"
        sudo systemctl daemon-reload
    fi

    # Remover venv
    rm -rf venv/

    print_success "Desinstalação concluída"
}

# Função: Mostrar ajuda
show_help() {
    cat << EOF
${GREEN}CinthiaMed Voice Service - Script de Gerenciamento${NC}

${YELLOW}Uso:${NC} ./manage.sh [comando]

${YELLOW}Comandos disponíveis:${NC}

  ${BLUE}install${NC}              Instala dependências e configura ambiente
  ${BLUE}test${NC}                 Executa servidor em modo de teste
  ${BLUE}health${NC}               Verifica saúde do serviço

  ${BLUE}install-service${NC}      Instala como serviço systemd (requer sudo)
  ${BLUE}start${NC}                Inicia o serviço systemd
  ${BLUE}stop${NC}                 Para o serviço systemd
  ${BLUE}restart${NC}              Reinicia o serviço systemd
  ${BLUE}status${NC}               Mostra status do serviço
  ${BLUE}logs${NC}                 Mostra logs em tempo real

  ${BLUE}download-model [size]${NC} Baixa modelo Whisper (tiny/base/small/medium)
  ${BLUE}clean${NC}                Remove arquivos temporários
  ${BLUE}uninstall${NC}            Remove completamente o serviço

  ${BLUE}help${NC}                 Mostra esta mensagem

${YELLOW}Exemplos:${NC}

  # Primeira instalação
  ./manage.sh install
  ./manage.sh test

  # Instalar como serviço
  sudo ./manage.sh install-service
  ./manage.sh start
  ./manage.sh logs

  # Baixar modelo específico
  ./manage.sh download-model small

${YELLOW}Mais informações:${NC}
  - README.md: Documentação completa
  - DEPLOY.md: Guia de deploy na VPS

EOF
}

# Processar comando
COMMAND=${1:-help}

case "$COMMAND" in
    install)
        install
        ;;
    test)
        test
        ;;
    health)
        health
        ;;
    install-service)
        install_service
        ;;
    start)
        start
        ;;
    stop)
        stop
        ;;
    restart)
        restart
        ;;
    status)
        status
        ;;
    logs)
        logs
        ;;
    download-model)
        download_model "$2"
        ;;
    clean)
        clean
        ;;
    uninstall)
        uninstall
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        print_error "Comando desconhecido: $COMMAND"
        echo ""
        show_help
        exit 1
        ;;
esac
