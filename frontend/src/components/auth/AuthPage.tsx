import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';

interface AuthPageProps {
  onLogin: (username: string, password: string) => void;
  onRegister: (username: string, password: string) => void;
  isLoading?: boolean;
  error?: string;
  successMessage?: string;
}

export default function AuthPage({
  onLogin,
  onRegister,
  isLoading = false,
  error,
  successMessage,
}: AuthPageProps) {
  const [authView, setAuthView] = useState<'login' | 'register'>('login');

  const handleLogin = (username: string, password: string) => {
    onLogin(username, password);
  };

  const handleRegister = (username: string, password: string) => {
    onRegister(username, password);
  };

  const toggleView = () => {
    setAuthView(authView === 'login' ? 'register' : 'login');
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>
              {authView === 'login' ? 'Login' : 'Create an Account'}
            </CardTitle>
            <Button variant="outline" onClick={toggleView} disabled={isLoading}>
              {authView === 'login' ? 'Register' : 'Have an account? Login'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {successMessage && (
            <div className="mb-3 text-sm text-green-700 border border-green-200 rounded p-2">
              {successMessage}
            </div>
          )}
          {error && (
            <div className="mb-3 text-sm text-red-700 border border-red-200 rounded p-2">
              {error}
            </div>
          )}
          {authView === 'login' ? (
            <LoginForm onSubmit={handleLogin} isLoading={isLoading} />
          ) : (
            <RegisterForm onSubmit={handleRegister} isLoading={isLoading} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
