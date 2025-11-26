import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';
import {
  AuthProvider,
  AuthServiceProvider,
  ChatProvider,
  ChatServiceProvider,
  ConfigProvider,
} from '@/contexts';
import AuthPage from '@/pages/AuthPage';
import ChatPage from '@/pages/ChatPage';
import SettingsPage from '@/pages/SettingsPage';
import './App.css';

function App() {
  return (
    <ConfigProvider>
      <AuthServiceProvider>
        <AuthProvider>
          <ChatServiceProvider>
            <ChatProvider>
              <Router>
                <Routes>
                  <Route path="/" element={<Navigate to="/auth" replace />} />
                  <Route path="/auth" element={<AuthPage />} />
                  <Route path="/chat" element={<ChatPage />} />
                  <Route path="/settings" element={<SettingsPage />} />
                  <Route path="*" element={<Navigate to="/auth" replace />} />
                </Routes>
              </Router>
            </ChatProvider>
          </ChatServiceProvider>
        </AuthProvider>
      </AuthServiceProvider>
    </ConfigProvider>
  );
}

export default App;
