/**
 * TokenManager - Manages short-lived JWT tokens in memory only
 * Provides secure token storage that doesn't persist across page reloads
 * Refresh is handled via session cookies
 */
class TokenManager {
  private static instance: TokenManager;
  private token: string | null = null;

  private constructor() {}

  public static getInstance(): TokenManager {
    if (!TokenManager.instance) {
      TokenManager.instance = new TokenManager();
    }
    return TokenManager.instance;
  }

  /**
   * Store JWT token in memory
   */
  public setToken(token: string): void {
    this.token = token;
  }

  /**
   * Get current JWT token from memory
   */
  public getToken(): string | null {
    return this.token;
  }

  /**
   * Clear token from memory
   */
  public clearToken(): void {
    this.token = null;
  }

  /**
   * Check if user has a valid token
   */
  public hasToken(): boolean {
    return this.token !== null;
  }
}

export default TokenManager;
