import pg from 'pg';
import { config } from './config.ts';

export type Prompt = {
  id: number;
  title: string;
  content: string;
  tags: string[];
  favorite: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
};

export type PromptInput = Pick<Prompt, 'title' | 'content' | 'tags' | 'favorite'>;

type Row = {
  id: number;
  title: string;
  content: string;
  tags: string[];
  favorite: boolean;
  created_by: string;
  created_at: Date;
  updated_at: Date;
};

const pool = new pg.Pool({ connectionString: config.databaseUrl });

function toPrompt(row: Row): Prompt {
  return {
    id: row.id,
    title: row.title,
    content: row.content,
    tags: row.tags,
    favorite: row.favorite,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listPrompts(): Promise<Prompt[]> {
  const { rows } = await pool.query<Row>('SELECT * FROM prompts ORDER BY favorite DESC, updated_at DESC');
  return rows.map(toPrompt);
}

export async function getPrompt(id: number): Promise<Prompt | undefined> {
  const { rows } = await pool.query<Row>('SELECT * FROM prompts WHERE id = $1', [id]);
  return rows[0] && toPrompt(rows[0]);
}

export async function createPrompt(input: PromptInput, createdBy: string): Promise<Prompt> {
  const { rows } = await pool.query<Row>(
    `INSERT INTO prompts (title, content, tags, favorite, created_by) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [input.title, input.content, input.tags, input.favorite, createdBy],
  );
  return toPrompt(rows[0]);
}

export async function updatePrompt(id: number, input: PromptInput): Promise<Prompt | undefined> {
  const { rows } = await pool.query<Row>(
    `UPDATE prompts SET title = $1, content = $2, tags = $3, favorite = $4, updated_at = now()
     WHERE id = $5 RETURNING *`,
    [input.title, input.content, input.tags, input.favorite, id],
  );
  return rows[0] && toPrompt(rows[0]);
}

export async function deletePrompt(id: number): Promise<boolean> {
  const { rowCount } = await pool.query('DELETE FROM prompts WHERE id = $1', [id]);
  return rowCount === 1;
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

// Creates the schema on first start and fills an empty table with a few examples.
export async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS prompts (
      id         SERIAL      PRIMARY KEY,
      title      TEXT        NOT NULL,
      content    TEXT        NOT NULL,
      tags       TEXT[]      NOT NULL DEFAULT '{}',
      favorite   BOOLEAN     NOT NULL DEFAULT false,
      created_by TEXT        NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);
  const { rows } = await pool.query<{ n: number }>('SELECT COUNT(*)::int AS n FROM prompts');
  if (rows[0].n === 0) {
    for (const p of seed) await createPrompt(p, 'Prompt Library');
  }
}
