import { useState } from 'react';
import type { Prompt } from './api';

type Props = {
  prompt: Prompt;
  canEdit: boolean;
  canDelete: boolean;
  onEdit: () => void;
  onToggleFavorite: () => void;
  onDelete: () => void;
};

export function PromptCard({ prompt, canEdit, canDelete, onEdit, onToggleFavorite, onDelete }: Props) {
  const [copied, setCopied] = useState(false);
  const [confirming, setConfirming] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(prompt.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <article className={`card ${prompt.favorite ? 'favorite' : ''}`}>
      <div className="card-top">
        <h2>{prompt.title}</h2>
        <button
          className={`star-btn ${prompt.favorite ? 'on' : ''}`}
          onClick={onToggleFavorite}
          disabled={!canEdit}
          title={prompt.favorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
        >
          {prompt.favorite ? '★' : '☆'}
        </button>
      </div>

      <p className="card-content">{prompt.content}</p>

      {prompt.tags.length > 0 && (
        <div className="tags">
          {prompt.tags.map((tag) => (
            <span key={tag} className="tag">
              {tag}
            </span>
          ))}
        </div>
      )}

      <p className="muted small author">par {prompt.createdBy}</p>

      <footer className="card-footer">
        <div className="card-actions">
          {confirming ? (
            <>
              <span className="small">Supprimer ?</span>
              <button className="btn btn-sm btn-danger" onClick={onDelete}>
                Oui
              </button>
              <button className="btn btn-sm btn-ghost" onClick={() => setConfirming(false)}>
                Non
              </button>
            </>
          ) : (
            <>
              <button className="btn btn-sm btn-ghost" onClick={copy}>
                {copied ? 'Copié ✓' : 'Copier'}
              </button>
              {canEdit && (
                <button className="btn btn-sm btn-ghost" onClick={onEdit}>
                  Modifier
                </button>
              )}
              {canDelete && (
                <button className="btn btn-sm btn-ghost danger-text" onClick={() => setConfirming(true)}>
                  Supprimer
                </button>
              )}
            </>
          )}
        </div>
      </footer>
    </article>
  );
}
