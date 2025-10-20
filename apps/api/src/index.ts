import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import http from 'http';
import { Server } from 'socket.io';
import { tasksRouter } from './routes/tasks.routes';
import { startScheduler } from './scheduler';

const app = express();
app.use(express.json());

// log de depuración: verás cada request en consola
app.use((req, _res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

const ORIGINS = (process.env.FRONTEND_ORIGINS ?? process.env.FRONTEND_ORIGIN ?? '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

app.use(cors({ origin: ORIGINS, credentials: true }));

app.get('/health', (_req, res) => res.json({ ok: true }));

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: ORIGINS } });

// 👇 MUY IMPORTANTE: aquí debe decir /tasks
app.use('/tasks', tasksRouter(io));

startScheduler(io);

const PORT = Number(process.env.PORT ?? 3000);
const HOST = process.env.HOST ?? '0.0.0.0';

server.listen(PORT, HOST, () => {
  console.log(`API listening on http://${HOST}:${PORT}`);
  console.log(`CORS allowed: ${ORIGINS.join(', ')}`);
});
