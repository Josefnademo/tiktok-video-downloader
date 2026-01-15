// server.js (ES Module)
import express from 'express';
import Bottleneck from 'bottleneck';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';

dotenv.config();
const app = express();
app.use(bodyParser.json());

// Serve static frontend from ./public (place index.html + assets there)
app.use(express.static('public'));

// Simple health check
app.get('/health', (req, res) => res.send('ok'));

// Simple protection: API token (set via env API_TOKEN)
const API_TOKEN = process.env.API_TOKEN;

// rate limiter: ~1 req/sec, max 2 concurrent
const limiter = new Bottleneck({
  minTime: 1000,
  maxConcurrent: 2,
});

async function downloadJob(url, options) {
  // TODO: call your real download logic from src/services
  // stub for now:
  return new Promise((resolve) => setTimeout(() => resolve({ success: true, title: 'demo', path: 'C:\\temp\\demo.mp4' }), 2000));
}

app.post('/api/download', async (req, res) => {
  const token = req.headers['x-api-token'];
  if (token !== API_TOKEN) return res.status(401).json({ error: 'Unauthorized' });

  const { url, quality } = req.body;
  if (!url) return res.status(400).json({ error: 'missing url' });

  try {
    const result = await limiter.schedule(() => downloadJob(url, { quality }));
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

const PORT = process.env.PORT ?? 3000;
app.listen(PORT, () => console.log('Server listening on', PORT));