import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts';
import { AuthPage as AuthPageComponent } from '@/components/auth';

export default function AuthPage() {
  const { login, register, isLoading, error, isAuthenticated, clearError } =
    useAuth();
  const [successMessage, setSuccessMessage] = useState<string | undefined>();
  const navigate = useNavigate();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/chat');
    }
  }, [isAuthenticated, navigate]);

  const handleLogin = async (username: string, password: string) => {
    try {
      clearError();
      await login(username, password);
      // Navigation will happen automatically via useEffect
    } catch (err) {
      // Error is handled by the AuthContext
      console.error('Login failed:', err);
    }
  };

  const handleRegister = async (username: string, password: string) => {
    try {
      clearError();
      await register(username, password);
      setSuccessMessage('Registration successful. Please log in.');
    } catch (err) {
      // Error is handled by the AuthContext
      console.error('Registration failed:', err);
    }
  };

  return (
    <AuthPageComponent
      onLogin={handleLogin}
      onRegister={handleRegister}
      isLoading={isLoading}
      error={error}
      successMessage={successMessage}
    />
  );
}
