export const config = {
  port: Number(process.env.PORT ?? 3000),
  issuer: process.env.OIDC_ISSUER ?? 'http://localhost:8080/realms/simple-app',
  audience: process.env.OIDC_AUDIENCE ?? 'simple-app-api',
  dbFile: process.env.DB_FILE ?? 'data.db',
};
