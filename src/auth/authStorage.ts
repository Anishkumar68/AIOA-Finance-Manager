export type Tokens = {
  accessToken: string;
  refreshToken: string;
};

const ACCESS_KEY = "aioa.access_token";
const REFRESH_KEY = "aioa.refresh_token";

export function getTokens(): Tokens | null {
  const accessToken = localStorage.getItem(ACCESS_KEY) ?? "";
  const refreshToken = localStorage.getItem(REFRESH_KEY) ?? "";
  if (!accessToken || !refreshToken) return null;
  return { accessToken, refreshToken };
}

export function setTokens(tokens: Tokens) {
  localStorage.setItem(ACCESS_KEY, tokens.accessToken);
  localStorage.setItem(REFRESH_KEY, tokens.refreshToken);
}

export function setAccessToken(accessToken: string) {
  localStorage.setItem(ACCESS_KEY, accessToken);
}

export function clearTokens() {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

