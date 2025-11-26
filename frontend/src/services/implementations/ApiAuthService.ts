import type {
  AuthService,
  RegisterRequest,
  User,
  AuthServiceConfig,
} from '@/types';
import TokenManager from '@/services/TokenManager';

/**
 * API-based implementation of AuthService
 * Uses fetch for HTTP requests
 */
export class ApiAuthService implements AuthService {
  private baseUrl: string;
  private tokenManager: TokenManager;

  constructor(config: AuthServiceConfig) {
    this.baseUrl = config.baseUrl || 'http://localhost:3000';
    this.tokenManager = TokenManager.getInstance();
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    // TODO: Implement the makeRequest helper method
    // This should:
    // 1. Construct the full URL using this.baseUrl and endpoint
    const url = `${this.baseUrl}${endpoint}`;

    // 2. Set up default headers including 'Content-Type': 'application/json'
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };
    
    // kind of copied from ApiPollingUpdateService.ts
    try {
      // 3. Use {credentials: 'include'} for session cookies
      // 4. Make the fetch request with the provided options
      const response = await fetch(url, {
        ...options,
        credentials: 'include',
        headers,
      });

      // 5. Handle non-ok responses by throwing an error with status and message
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // 6. Return the parsed JSON response
      return await response.json() as T;
    } catch (error) {
      console.error('Error making request: ', error);
      throw error;
    }

    // throw new Error('makeRequest method not implemented');
  }

  async login(username: string, password: string): Promise<User> {
    // TODO: Implement login method
    // This should:
    // 1. Make a request to the appropriate endpoint
    const response = await this.makeRequest<{ user: User; token: string }> (
      '/auth/login',
      {
        method: 'POST',
        body: JSON.stringify({username, password})
      },
    );

    // 2. Store the token using this.tokenManager.setToken(response.token)
    this.tokenManager.setToken(response.token);
    
    // 3. Return the user object
    return response.user;

    // See API_SPECIFICATION.md for endpoint details

    // throw new Error('login method not implemented');
  }

  async register(userData: RegisterRequest): Promise<User> {
    // TODO: Implement register method

    // This should:
    // 1. Make a request to the appropriate endpoint
    const response = await this.makeRequest<{ user: User; token: string }> (
      '/auth/register',
      {
        method: 'POST',
        body: JSON.stringify(userData),
      },
    );

    // 2. Store the token using this.tokenManager.setToken(response.token)
    this.tokenManager.setToken(response.token);

    // 3. Return the user object
    return response.user;

    // See API_SPECIFICATION.md for endpoint details

    // throw new Error('register method not implemented');
  }

  async logout(): Promise<void> {
    // TODO: Implement logout method
    // This should:

    try {
    // 1. Make a request to the appropriate endpoint
      await this.makeRequest<{ message: string } > (
        '/auth/logout',
        {
          method: 'POST',
        }
      );

    // 2. Handle errors gracefully (continue with logout even if API call fails)
    } catch (error) {
      console.error('Logout API call failed: ', error);
    }

    // 3. Clear the token using this.tokenManager.clearToken()
    this.tokenManager.clearToken();

    // See API_SPECIFICATION.md for endpoint details

    // throw new Error('logout method not implemented');
  }

  async refreshToken(): Promise<User> {
    // TODO: Implement refreshToken method
    // This should:

    // 1. Make a request to the appropriate endpoint
    const response = await this.makeRequest<{ user: User; token: string }> (
      '/auth/refresh',
      {
        method: 'POST',
      },
    );

    // 3. Update the stored token using this.tokenManager.setToken(response.token)
    this.tokenManager.setToken(response.token);

    // 4. Return the user object
    return response.user;

    // See API_SPECIFICATION.md for endpoint details

    // throw new Error('refreshToken method not implemented');
  }

  async getCurrentUser(): Promise<User | null> {
    // TODO: Implement getCurrentUser method
    // This should:
    
    try {
    // 1. Make a request to the appropriate endpoint
      const response = await this.makeRequest<User> (
        '/auth/me',
        {
          method: 'GET',
        },
      );
    // 2. Return the user object if successful
      return response;

    // 3. If the request fails (e.g., session invalid), clear the token and return null
    } catch (error) {
      // console.error("Error getting current user: ", error);
      this.tokenManager.clearToken();
      return null;
    }

    // See API_SPECIFICATION.md for endpoint details

    // throw new Error('getCurrentUser method not implemented');
  }
}
