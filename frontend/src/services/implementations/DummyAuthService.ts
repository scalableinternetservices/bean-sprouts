import type { AuthService, RegisterRequest, User } from '@/types';

/**
 * Dummy implementation of AuthService for development and testing
 */
export class DummyAuthService implements AuthService {
  private storageKey = 'dummy-auth-data';
  private delay = 200; // Base delay in ms

  private async delayResponse<T>(data: T): Promise<T> {
    await new Promise(resolve =>
      setTimeout(resolve, this.delay + Math.random() * 100)
    );
    return data;
  }

  private getAuthData(): {
    currentUser: User | null;
    users: Array<{ username: string; password: string }>;
  } {
    const data = localStorage.getItem(this.storageKey);
    return data
      ? JSON.parse(data)
      : { currentUser: null, users: this.getInitialUsers() };
  }

  private setAuthData(data: {
    currentUser: User | null;
    users: Array<{ username: string; password: string }>;
  }): void {
    localStorage.setItem(this.storageKey, JSON.stringify(data));
  }

  private getInitialUsers() {
    return [
      { username: 'alice', password: 'password' },
      { username: 'bob', password: 'password' },
      { username: 'charlie', password: 'password' },
    ];
  }

  async login(username: string, password: string): Promise<User> {
    const authData = this.getAuthData();
    const user = authData.users.find(
      u => u.username === username && u.password === password
    );

    if (!user) {
      throw new Error('Invalid username or password');
    }

    const authUser: User = {
      id: user.username,
      username: user.username,
      createdAt: '2024-01-01T00:00:00Z',
      lastActiveAt: new Date().toISOString(),
    };

    authData.currentUser = authUser;
    this.setAuthData(authData);
    return this.delayResponse(authUser);
  }

  async register(userData: RegisterRequest): Promise<User> {
    const authData = this.getAuthData();

    // Check if user already exists
    const existingUser = authData.users.find(
      u => u.username === userData.username
    );
    if (existingUser) {
      throw new Error('Username already exists');
    }

    // Add new user
    const newUser = {
      username: userData.username,
      password: userData.password,
    };
    authData.users.push(newUser);

    const authUser: User = {
      id: newUser.username,
      username: newUser.username,
      createdAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString(),
    };

    authData.currentUser = authUser;
    this.setAuthData(authData);
    return this.delayResponse(authUser);
  }

  async logout(): Promise<void> {
    const authData = this.getAuthData();
    authData.currentUser = null;
    this.setAuthData(authData);
    await this.delayResponse(undefined);
  }

  async refreshToken(): Promise<User> {
    const authData = this.getAuthData();
    if (!authData.currentUser) {
      throw new Error('No current user to refresh token for');
    }

    const refreshedAuthUser: User = {
      ...authData.currentUser,
    };

    authData.currentUser = refreshedAuthUser;
    this.setAuthData(authData);
    return this.delayResponse(refreshedAuthUser);
  }

  async getCurrentUser(): Promise<User | null> {
    const authData = this.getAuthData();
    return this.delayResponse(authData.currentUser);
  }
}
