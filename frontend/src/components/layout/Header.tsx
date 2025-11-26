import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

interface HeaderProps {
  mode: 'user' | 'expert';
  onModeToggle: () => void;
  onLogout: () => void;
  currentUser?: string;
}

export default function Header({
  mode,
  onModeToggle,
  onLogout,
  currentUser: _currentUser,
}: HeaderProps) {
  return (
    <div className="flex justify-between items-center">
      <h2 className="text-lg font-bold">
        {mode === 'user' ? 'Conversations' : 'Expert Panel'}
      </h2>
      <div className="flex gap-2">
        <Button variant="outline" onClick={onModeToggle}>
          Switch to {mode === 'user' ? 'Expert' : 'User'}
        </Button>
        <Button variant="outline" asChild>
          <Link to="/settings">Settings</Link>
        </Button>
        <Button variant="ghost" onClick={onLogout}>
          Logout
        </Button>
      </div>
    </div>
  );
}
