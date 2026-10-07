import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { AuthProvider } from 'react-oidc-context';
import { App } from './App';
import './styles.css';

const oidcConfig = {
  authority: import.meta.env.VITE_OIDC_AUTHORITY ?? 'http://localhost:8080/realms/simple-app',
  client_id: import.meta.env.VITE_OIDC_CLIENT_ID ?? 'simple-app-frontend',
  redirect_uri: window.location.origin + '/',
  post_logout_redirect_uri: window.location.origin + '/',
  scope: 'openid profile email',
  // Remove ?code=...&state=... from the URL once the login is complete.
  onSigninCallback: () => window.history.replaceState({}, document.title, window.location.pathname),
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider {...oidcConfig}>
      <App />
    </AuthProvider>
  </StrictMode>,
);
