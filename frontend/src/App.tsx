import { useAuth } from 'react-oidc-context';
import { Landing } from './Landing';
import { PromptsPage } from './PromptsPage';

export function App() {
  const auth = useAuth();

  if (auth.isLoading) return <div className="splash">Chargement…</div>;
  if (!auth.isAuthenticated) return <Landing error={auth.error?.message} onLogin={() => auth.signinRedirect()} />;
  return <PromptsPage />;
}
