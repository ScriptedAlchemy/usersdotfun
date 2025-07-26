import { Hono } from 'hono';
import { bullRouter } from './routes/bull';
import { jobsRouter } from './routes/jobs';

const app = new Hono();

app.get('/', (c) => {
  return c.text('Hello Hono!');
});

app.route('/bull', bullRouter);
app.route('/api/jobs', jobsRouter);

export default app;
