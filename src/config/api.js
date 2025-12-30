// Configuração da URL da API
// Detecta automaticamente se está em desenvolvimento ou produção

const API_URL = process.env.NODE_ENV === 'production'
  ? 'https://api-cinthiamed.duckdns.org'  // Substitua pelo seu domínio DuckDNS depois
  : 'http://localhost:5000';

export default API_URL;
