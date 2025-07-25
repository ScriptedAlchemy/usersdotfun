import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { HonoAdapter } from '@bull-board/hono';
import { Queue } from 'bullmq';
import { Hono } from 'hono';
import { serveStatic } from "hono/bun";

const redisOptions = {
  port: 6379,
  host: 'localhost',
  password: '',
};

const bullMq = new Queue('BullMQ', { connection: redisOptions });

const app = new Hono();

const serverAdapter = new HonoAdapter(serveStatic);

createBullBoard({
  queues: [new BullMQAdapter(bullMq)],
  serverAdapter,
});

const basePath = '/ui';
serverAdapter.setBasePath(basePath);
app.route(basePath, serverAdapter.registerPlugin());

export const bullRouter = app;
