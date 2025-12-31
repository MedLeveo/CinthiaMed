// Configuração da URL da API
// Detecta automaticamente se está em desenvolvimento ou produção

const API_URL = process.env.NODE_ENV === 'production'
  ? 'https://cinthiamed.vercel.app'
  : 'http://localhost:5000';

export default API_URL;
