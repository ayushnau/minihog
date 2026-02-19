import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Flame } from 'lucide-react';

const SignIn = () => {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      if (isRegister) {
        await register(username, email, password);
      } else {
        await login(username, password);
      }
      navigate('/dashboard');
    } catch {
      setError('Authentication failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm animate-fade-in">
        <div className="text-center mb-8">
          <Flame className="h-10 w-10 text-primary mx-auto mb-3" />
          <h1 className="text-2xl font-bold">
            {isRegister ? 'Create Account' : 'Sign In'}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isRegister ? 'Start tracking your analytics' : 'Welcome back to MiniHog'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm text-muted-foreground">Username</label>
            <Input value={username} onChange={e => setUsername(e.target.value)} required className="mt-1" />
          </div>
          {isRegister && (
            <div>
              <label className="text-sm text-muted-foreground">Email</label>
              <Input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="mt-1" />
            </div>
          )}
          <div>
            <label className="text-sm text-muted-foreground">Password</label>
            <Input type="password" value={password} onChange={e => setPassword(e.target.value)} required className="mt-1" />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button type="submit" className="w-full gradient-primary border-0 text-primary-foreground">
            {isRegister ? 'Create Account' : 'Sign In'}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-4">
          {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button onClick={() => setIsRegister(!isRegister)} className="text-primary hover:underline">
            {isRegister ? 'Sign In' : 'Sign Up'}
          </button>
        </p>

        <Link to="/" className="block text-center text-sm text-muted-foreground mt-6 hover:text-foreground">
          ← Back to home
        </Link>
      </div>
    </div>
  );
};

export default SignIn;
