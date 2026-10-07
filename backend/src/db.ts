import { DatabaseSync } from 'node:sqlite';
import { config } from './config.ts';

export type Prompt = {
  id: number;
  title: string;
  content: string;
  tags: string[];
  favorite: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
};

export type PromptInput = Pick<Prompt, 'title' | 'content' | 'tags' | 'favorite'>;

type Row = {
  id: number;
  title: string;
  content: string;
  tags: string;
  favorite: number;
  created_by: string;
  created_at: string;
  updated_at: string;
};

const db = new DatabaseSync(config.dbFile);

db.exec(`
  CREATE TABLE IF NOT EXISTS prompts (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    title      TEXT    NOT NULL,
    content    TEXT    NOT NULL,
    tags       TEXT    NOT NULL DEFAULT '[]',
    favorite   INTEGER NOT NULL DEFAULT 0,
    created_by TEXT    NOT NULL,
    created_at TEXT    NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT    NOT NULL DEFAULT (datetime('now'))
  )
`);

function toPrompt(row: Row): Prompt {
  return {
    id: row.id,
    title: row.title,
    content: row.content,
    tags: JSON.parse(row.tags),
    favorite: row.favorite === 1,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function listPrompts(): Prompt[] {
  const rows = db.prepare('SELECT * FROM prompts ORDER BY favorite DESC, updated_at DESC').all();
  return (rows as Row[]).map(toPrompt);
}

export function getPrompt(id: number): Prompt | undefined {
  const row = db.prepare('SELECT * FROM prompts WHERE id = ?').get(id) as Row | undefined;
  return row && toPrompt(row);
}

export function createPrompt(input: PromptInput, createdBy: string): Prompt {
  const { lastInsertRowid } = db
    .prepare('INSERT INTO prompts (title, content, tags, favorite, created_by) VALUES (?, ?, ?, ?, ?)')
    .run(input.title, input.content, JSON.stringify(input.tags), input.favorite ? 1 : 0, createdBy);
  return getPrompt(Number(lastInsertRowid))!;
}

export function updatePrompt(id: number, input: PromptInput): Prompt | undefined {
  db.prepare(
    `UPDATE prompts SET title = ?, content = ?, tags = ?, favorite = ?, updated_at = datetime('now') WHERE id = ?`,
  ).run(input.title, input.content, JSON.stringify(input.tags), input.favorite ? 1 : 0, id);
  return getPrompt(id);
}

export function deletePrompt(id: number): boolean {
  return db.prepare('DELETE FROM prompts WHERE id = ?').run(id).changes > 0;
}

const seed: PromptInput[] = [
  {
    title: 'Relecture de code bienveillante',
    content:
      'Relis ce diff comme un collègue senior. Commence par ce qui est bien, puis liste au plus 3 problèmes, du plus important au moins important, avec une suggestion concrète pour chacun.',
    tags: ['code', 'review'],
    favorite: true,
  },
  {
    title: 'Résumé de réunion',
    content:
      'À partir de ces notes brutes, produis : 1) les décisions prises, 2) les actions avec un responsable et une date, 3) les questions ouvertes. Reste factuel, pas de reformulation inutile.',
    tags: ['écriture', 'réunion'],
    favorite: false,
  },
  {
    title: 'Expliquer à un enfant de 10 ans',
    content:
      'Explique le concept suivant à un enfant de 10 ans, avec une analogie de la vie quotidienne et sans jargon. Termine par une question pour vérifier qu’il a compris.',
    tags: ['pédagogie'],
    favorite: false,
  },
];

if ((db.prepare('SELECT COUNT(*) AS n FROM prompts').get() as { n: number }).n === 0) {
  for (const p of seed) createPrompt(p, 'Prompt Library');
}
