export type JwtClaims = {
  sub: string;
  email?: string;
  role?: "admin" | "analyst" | "viewer";
  tenant_id?: string;
};

export class AuthService {
  public parseAuthHeader(header?: string): string | null {
    if (!header) return null;
    const [type, token] = header.split(" ", 2);
    if (type?.toLowerCase() !== "bearer" || !token) return null;
    return token;
  }

  public verifyJwt(_token: string): JwtClaims | null {
    // Stub: in Integration phase, verify signature and parse claims
    return null;
  }

  public hasRole(claims: JwtClaims | null, roles: Array<"admin" | "analyst" | "viewer">): boolean {
    if (!claims?.role) return false;
    return roles.includes(claims.role);
  }
}


