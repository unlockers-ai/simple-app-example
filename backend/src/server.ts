import path from 'node:path';
import express, { type Request, type Response } from 'express';
import { authenticate, requireRole } from './auth.ts';
import { config } from './config.ts';
import { createPrompt, deletePrompt, getPrompt, initDb, listPrompts, updatePrompt, type PromptInput } from './db.ts';

const app = express();
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.use('/api', authenticate);

app.get('/api/me', (req, res) => {
  res.json(req.user);
});

app.get('/api/prompts', requireRole('viewer'), async (_req, res) => {
  res.json(await listPrompts());
});

app.get('/api/prompts/:id', requireRole('viewer'), async (req, res) => {
  const prompt = await getPrompt(Number(req.params.id));
  if (!prompt) return res.status(404).json({ error: 'Not found' });
  res.json(prompt);
});

app.post('/api/prompts', requireRole('editor'), async (req, res) => {
  const input = parseInput(req, res);
  if (!input) return;
  res.status(201).json(await createPrompt(input, req.user!.name));
});

app.put('/api/prompts/:id', requireRole('editor'), async (req, res) => {
  const input = parseInput(req, res);
  if (!input) return;
  const prompt = await updatePrompt(Number(req.params.id), input);
  if (!prompt) return res.status(404).json({ error: 'Not found' });
  res.json(prompt);
});

app.delete('/api/prompts/:id', requireRole('admin'), async (req, res) => {
  if (!(await deletePrompt(Number(req.params.id)))) return res.status(404).json({ error: 'Not found' });
  res.status(204).end();
});

function parseInput(req: Request, res: Response): PromptInput | undefined {
  const { title, content, tags = [], favorite = false } = req.body ?? {};
  if (typeof title !== 'string' || !title.trim() || typeof content !== 'string' || !content.trim()) {
    res.status(400).json({ error: 'title and content are required' });
    return;
  }
  if (!Array.isArray(tags) || !tags.every((t) => typeof t === 'string')) {
    res.status(400).json({ error: 'tags must be an array of strings' });
    return;
  }
  return {
    title: title.trim(),
    content: content.trim(),
    tags: tags.map((t: string) => t.trim()).filter(Boolean),
    favorite: Boolean(favorite),
  };
}

// Production: the API also serves the built frontend, with a fallback to index.html.
if (config.staticDir) {
  const staticDir = config.staticDir;
  app.use(express.static(staticDir));
  app.get(/^(?!\/api\/).*/, (_req, res) => res.sendFile(path.resolve(staticDir, 'index.html')));
}

await initDb();
app.listen(config.port, () => {
  console.log(`API ready on http://localhost:${config.port}`);
});
