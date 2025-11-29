import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface LoginFormProps {
  onSubmit: (username: string, password: string) => void;
  isLoading?: boolean;
  error?: string;
}

export default function LoginForm({
  onSubmit,
  isLoading = false,
  error: _error,
}: LoginFormProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim() && password.trim()) {
      onSubmit(username, password);
    }
  };

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
      <Button
        onClick={handleSubmit}
        disabled={!username.trim() || !password.trim() || isLoading}
        className="w-full bg-gray-500 hover:bg-gray-600 text-white"
      >
        {isLoading ? 'Logging in...' : 'Log In'}
      </Button>
    </div>
  );
}
