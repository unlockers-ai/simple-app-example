import { useState, type FormEvent } from 'react';
import type { Prompt, PromptInput } from './api';

type Props = {
  prompt?: Prompt;
  onSave: (input: PromptInput) => void;
  onClose: () => void;
};

export function PromptDialog({ prompt, onSave, onClose }: Props) {
  const [title, setTitle] = useState(prompt?.title ?? '');
  const [content, setContent] = useState(prompt?.content ?? '');
  const [tags, setTags] = useState(prompt?.tags.join(', ') ?? '');
  const [favorite, setFavorite] = useState(prompt?.favorite ?? false);

  function submit(e: FormEvent) {
    e.preventDefault();
    onSave({
      title,
      content,
      favorite,
      tags: tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
    });
  }

  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <form className="dialog" onSubmit={submit} onKeyDown={(e) => e.key === 'Escape' && onClose()}>
        <h2>{prompt ? 'Modifier le prompt' : 'Nouveau prompt'}</h2>

        <label>
          Titre
          <input value={title} onChange={(e) => setTitle(e.target.value)} required autoFocus />
        </label>

        <label>
          Prompt
          <textarea value={content} onChange={(e) => setContent(e.target.value)} rows={7} required />
        </label>

        <label>
          <span>
            Tags <span className="muted small">(séparés par des virgules)</span>
          </span>
          <input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="code, écriture" />
        </label>

        <label className="checkbox">
          <input type="checkbox" checked={favorite} onChange={(e) => setFavorite(e.target.checked)} />
          Favori
        </label>

        <div className="dialog-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Annuler
          </button>
          <button type="submit" className="btn btn-primary">
            Enregistrer
          </button>
        </div>
      </form>
    </div>
  );
}
