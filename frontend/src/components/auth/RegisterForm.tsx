import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface RegisterFormProps {
  onSubmit: (username: string, password: string) => void;
  isLoading?: boolean;
  error?: string;
}

export default function RegisterForm({
  onSubmit,
  isLoading = false,
  error: _error,
}: RegisterFormProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSubmit = () => {
    if (username.trim() && password.trim() && password === confirmPassword) {
      onSubmit(username, password);
    }
  };

  const passwordsMatch = password === confirmPassword;
  const isFormValid = username.trim() && password.trim() && passwordsMatch;

  return (
    <div className="space-y-3">
      <div>
        <label className="text-sm text-left block">Username</label>
        <Input
          value={username}
          onChange={e => setUsername(e.target.value)}
          placeholder="yourname"
          disabled={isLoading}
          required
        />
      </div>
      <div>
        <label className="text-sm text-left block">Password</label>
        <Input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="••••••••"
          disabled={isLoading}
          required
        />
      </div>
      <div>
        <label className="text-sm text-left block">Confirm Password</label>
        <Input
          type="password"
          value={confirmPassword}
          onChange={e => setConfirmPassword(e.target.value)}
          placeholder="••••••••"
          disabled={isLoading}
          required
        />
        {confirmPassword && !passwordsMatch && (
          <p className="text-xs text-red-600 mt-1">Passwords do not match</p>
        )}
      </div>
      <Button
        onClick={handleSubmit}
        disabled={!isFormValid || isLoading}
        className="w-full bg-gray-500 hover:bg-gray-600 text-white"
      >
        {isLoading ? 'Creating Account...' : 'Create Account'}
      </Button>
    </div>
  );
}
