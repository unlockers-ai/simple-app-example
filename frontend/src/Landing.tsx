type Props = { onLogin: () => void; error?: string };

export function Landing({ onLogin, error }: Props) {
  return (
    <main className="landing">
      <section className="landing-copy">
        <Logo />
        <h1>
          Vos meilleurs prompts,
          <br />
          <em>enfin rangés.</em>
        </h1>
        <p>
          Une bibliothèque partagée pour l’équipe et pour vos agents. Retrouvez, améliorez et réutilisez les
          prompts qui marchent.
        </p>
        <button className="btn btn-primary btn-lg" onClick={onLogin}>
          Se connecter
        </button>
        {error && <p className="error">Connexion impossible : {error}</p>}
      </section>

      <section className="landing-art" aria-hidden>
        <div className="art-card art-card-1">
          <span className="tag">code</span>
          <strong>Relecture bienveillante</strong>
          <span className="line" />
          <span className="line short" />
        </div>
        <div className="art-card art-card-2">
          <span className="tag tag-sage">écriture</span>
          <strong>Résumé de réunion</strong>
          <span className="line" />
          <span className="line" />
          <span className="line short" />
        </div>
        <div className="art-card art-card-3">
          <span className="star">★</span>
          <strong>Expliquer simplement</strong>
          <span className="line short" />
        </div>
      </section>
    </main>
  );
}

export function Logo() {
  return (
    <div className="logo">
      <svg width="28" height="28" viewBox="0 0 32 32" aria-hidden>
        <rect width="32" height="32" rx="9" fill="var(--accent)" />
        <path d="M10 11h12M10 16h9M10 21h6" stroke="white" strokeWidth="2.6" strokeLinecap="round" />
      </svg>
      <span>Prompt Library</span>
    </div>
  );
}
