export type Session = { token: string | null };

let current: Session = { token: null };

export function setToken(token: string | null) {
  current = { token };
}

export function getToken(): string | null {
  return current.token;
}


