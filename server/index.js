import express from 'express';
import session from 'express-session';
import cors from 'cors';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import authRouter from './routes/auth.js';
import doorRouter from './routes/door.js';
import adminRouter from './routes/admin.js';
import { initDatabase } from './db/database.js';
import { initBot } from './discord/bot.js';
import { initGPIO } from './gpio/controller.js';

config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const isProduction = process.env.NODE_ENV === 'production';

// Middleware
if (!isProduction) {
  app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true
  }));
}

app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: isProduction,
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Initialize database
await initDatabase();

// Initialize Discord bot
await initBot();

// Initialize GPIO
initGPIO();

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/door', doorRouter);
app.use('/api/admin', adminRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Serve static files in production
if (isProduction) {
  const clientDistPath = join(__dirname, '../client/dist');
  app.use(express.static(clientDistPath));
  
  // Serve index.html for all non-API routes (SPA support)
  app.get('*', (req, res) => {
    res.sendFile(join(clientDistPath, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Mode: ${isProduction ? 'Production' : 'Development'}`);
  if (isProduction) {
    console.log(`Visit: http://localhost:${PORT}`);
  }
});
