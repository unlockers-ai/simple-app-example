const issuer = process.env.OIDC_ISSUER ?? 'http://localhost:8080/realms/simple-app';

export const config = {
  port: Number(process.env.PORT ?? 3000),
  issuer,
  // In production the API can fetch Keycloak's keys over the internal network instead of the public URL.
  jwksUrl: process.env.OIDC_JWKS_URL ?? `${issuer}/protocol/openid-connect/certs`,
  audience: process.env.OIDC_AUDIENCE ?? 'simple-app-api',
  databaseUrl: process.env.DATABASE_URL ?? 'postgres://app:app@localhost:5432/app',
  // When set, the API also serves the built frontend (production).
  staticDir: process.env.STATIC_DIR,
};
