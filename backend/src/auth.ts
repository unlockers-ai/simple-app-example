import type { NextFunction, Request, Response } from 'express';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import { config } from './config.ts';

export type Role = 'viewer' | 'editor' | 'admin';

export type User = {
  id: string;
  name: string;
  roles: string[];
};

declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

const jwks = createRemoteJWKSet(new URL(config.jwksUrl));

// Verifies the Bearer access token issued by Keycloak and exposes the caller on req.user.
export async function authenticate(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.match(/^Bearer (.+)$/)?.[1];
  if (!token) return res.status(401).json({ error: 'Missing bearer token' });

  try {
    const { payload } = await jwtVerify(token, jwks, {
      issuer: config.issuer,
      audience: config.audience,
    });
    const realmAccess = payload.realm_access as { roles?: string[] } | undefined;
    req.user = {
      id: payload.sub!,
      name: (payload.name ?? payload.preferred_username ?? payload.azp ?? payload.sub) as string,
      roles: realmAccess?.roles ?? [],
    };
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

// Roles are composite in Keycloak (admin ⊃ editor ⊃ viewer), so checking one role is enough.
export function requireRole(role: Role) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.user?.roles.includes(role)) return next();
    res.status(403).json({ error: `Role "${role}" required` });
  };
}
