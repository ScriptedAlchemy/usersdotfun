import { Hono } from 'hono';
import { bullRouter } from './routes/bull';

const app = new Hono();

app.get('/', (c) => {
  return c.text('Hello Hono!');
});

app.route('/bull', bullRouter);

export default app;
