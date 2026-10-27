import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { attachActor } from './middleware/auth.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import { getDbMode } from './config/db.js';
import { isAiEnabled } from './services/geminiService.js';
import authRoutes from './routes/authRoutes.js';
import sessionRoutes from './routes/sessionRoutes.js';
import assistRoutes from './routes/assistRoutes.js';

const app = express();

const clientOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:5173';

app.use(
  cors({
    origin: clientOrigin,
    credentials: true
  })
);
// big limit because a photo comes in as base64, about a third bigger than the
// image. what is actually accepted is checked in the engine
app.use(express.json({ limit: '6mb' }));
app.use(cookieParser());
app.use(attachActor);

app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    database: getDbMode(),
    aiEnabled: isAiEnabled(),
    time: new Date().toISOString()
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/assist', assistRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
