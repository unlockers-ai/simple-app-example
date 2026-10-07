import { useEffect, useMemo, useState } from 'react';
import { useAuth } from 'react-oidc-context';
import { createApi, type Me, type Prompt, type PromptInput } from './api';
import { Logo } from './Landing';
import { PromptCard } from './PromptCard';
import { PromptDialog } from './PromptDialog';

export function PromptsPage() {
  const auth = useAuth();
  const api = useMemo(() => createApi(auth.user!.access_token), [auth.user]);

  const [me, setMe] = useState<Me>();
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string>();
  const [query, setQuery] = useState('');
  const [activeTag, setActiveTag] = useState<string>();
  const [editing, setEditing] = useState<Prompt | 'new'>();

  const canEdit = me?.roles.includes('editor') ?? false;
  const canDelete = me?.roles.includes('admin') ?? false;

  useEffect(() => {
    Promise.all([api.me(), api.list()])
      .then(([me, prompts]) => {
        setMe(me);
        setPrompts(prompts);
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoaded(true));
  }, [api]);

  const tags = useMemo(() => [...new Set(prompts.flatMap((p) => p.tags))].sort(), [prompts]);

  const visible = prompts.filter((p) => {
    const q = query.toLowerCase();
    const matchesQuery = !q || p.title.toLowerCase().includes(q) || p.content.toLowerCase().includes(q);
    return matchesQuery && (!activeTag || p.tags.includes(activeTag));
  });

  async function run(action: () => Promise<void>) {
    try {
      setError(undefined);
      await action();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  const save = (input: PromptInput) =>
    run(async () => {
      if (editing === 'new') {
        const created = await api.create(input);
        setPrompts((ps) => [created, ...ps]);
      } else if (editing) {
        const updated = await api.update(editing.id, input);
        setPrompts((ps) => ps.map((p) => (p.id === updated.id ? updated : p)));
      }
      setEditing(undefined);
    });

  const toggleFavorite = (prompt: Prompt) =>
    run(async () => {
      const updated = await api.update(prompt.id, { ...prompt, favorite: !prompt.favorite });
      setPrompts((ps) => ps.map((p) => (p.id === updated.id ? updated : p)));
    });

  const remove = (prompt: Prompt) =>
    run(async () => {
      await api.remove(prompt.id);
      setPrompts((ps) => ps.filter((p) => p.id !== prompt.id));
    });

  return (
    <div className="page">
      <header className="topbar">
        <Logo />
        <div className="user">
          {me && (
            <>
              <span className="avatar">{initials(me.name)}</span>
              <span className="user-name">{me.name}</span>
              <span className="role-badge">{topRole(me.roles)}</span>
            </>
          )}
          <button className="btn btn-ghost" onClick={() => auth.signoutRedirect()}>
            Se déconnecter
          </button>
        </div>
      </header>

      <main className="content">
        <div className="heading">
          <div>
            <h1>Bibliothèque</h1>
            <p className="muted">
              {prompts.length} prompt{prompts.length > 1 ? 's' : ''} partagé{prompts.length > 1 ? 's' : ''}
            </p>
          </div>
          {canEdit && (
            <button className="btn btn-primary" onClick={() => setEditing('new')}>
              + Nouveau prompt
            </button>
          )}
        </div>

        <div className="toolbar">
          <input
            className="search"
            type="search"
            placeholder="Rechercher un prompt…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <div className="chips">
            <button className={`chip ${!activeTag ? 'active' : ''}`} onClick={() => setActiveTag(undefined)}>
              Tous
            </button>
            {tags.map((tag) => (
              <button
                key={tag}
                className={`chip ${activeTag === tag ? 'active' : ''}`}
                onClick={() => setActiveTag(activeTag === tag ? undefined : tag)}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {error && <div className="alert">{error}</div>}

        {loaded && visible.length === 0 ? (
          <div className="empty">
            <p>Aucun prompt ici pour l’instant.</p>
            {canEdit && (
              <button className="btn btn-primary" onClick={() => setEditing('new')}>
                Écrire le premier
              </button>
            )}
          </div>
        ) : (
          <div className="grid">
            {visible.map((prompt) => (
              <PromptCard
                key={prompt.id}
                prompt={prompt}
                canEdit={canEdit}
                canDelete={canDelete}
                onEdit={() => setEditing(prompt)}
                onToggleFavorite={() => toggleFavorite(prompt)}
                onDelete={() => remove(prompt)}
              />
            ))}
          </div>
        )}
      </main>

      {editing && (
        <PromptDialog
          prompt={editing === 'new' ? undefined : editing}
          onSave={save}
          onClose={() => setEditing(undefined)}
        />
      )}
    </div>
  );
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function topRole(roles: string[]) {
  return ['admin', 'editor', 'viewer'].find((r) => roles.includes(r)) ?? 'aucun rôle';
}
