import React, { useState } from 'react';
import { useAuth } from '../../context/useAuth';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Card, { CardHeader, CardTitle, CardContent, CardFooter } from '../ui/Card';
import { Mail, Lock, LogIn } from 'lucide-react';

interface LoginFormProps {
  onSuccess?: () => void;
  onRegisterClick: () => void;
  onForgotPasswordClick: () => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onSuccess, onRegisterClick, onForgotPasswordClick }) => {
  const { login, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }

    try {
      const success = await login(email, password);

      if (success) {
        if (onSuccess) onSuccess();
      } else {
        setError('Invalid email or password');
      }
    } catch {
      setError('Login failed. Please check your credentials.');
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-center text-2xl">Login to Your Account</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-100 border border-red-200 text-red-700 rounded-md text-sm">
              {error}
            </div>
          )}

          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            fullWidth
            leftIcon={<Mail size={18} />}
            required
          />

          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            fullWidth
            leftIcon={<Lock size={18} />}
            required
          />

          <Button
            type="submit"
            fullWidth
            isLoading={isLoading}
            leftIcon={<LogIn size={18} />}
          >
            Login
          </Button>
        </form>
        <div className="text-center mt-4">
          <button
            onClick={onForgotPasswordClick}
            className="text-sm text-gray-600 hover:text-primary-500"
            type="button"
          >
            Forgot Password?
          </button>
        </div>
      </CardContent>
      <CardFooter className="flex justify-center">
        <p className="text-sm text-gray-600">
          Don't have an account?{' '}
          <button
            onClick={onRegisterClick}
            className="text-black hover:text-primary-500 font-medium"
            type="button"
          >
            Register Now
          </button>
        </p>
      </CardFooter>
    </Card>
  );
};

export default LoginForm;