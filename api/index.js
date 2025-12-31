// Vercel Serverless Function Handler
import express from 'express';
import cors from 'cors';

const app = express();

// CORS
app.use(cors({
  origin: true,
  credentials: true
}));

app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Teste simples
app.post('/api/test', (req, res) => {
  res.json({ message: 'Backend funcionando!', body: req.body });
});

// Export handler para Vercel
export default app;
