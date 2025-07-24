import React, { useState } from 'react';
import { useAuth } from '../../context/useAuth';
import Input from '../ui/Input'; 
import Button from '../ui/Button';
import { Award, Mail, Lock, LogIn, Eye, EyeOff } from 'lucide-react';

interface LoginFormProps {
  onSuccess?: () => void;
  onRegisterClick?: () => void;
  onForgotPasswordClick?: () => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onSuccess, onRegisterClick, onForgotPasswordClick }) => {
  const { login, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
    <div className="w-full max-w-sm p-8 space-y-4 bg-white/20 backdrop-blur-lg rounded-xl shadow-lg border border-white/30 animate-fadeIn">
      <div className="text-center mb-6">
        <div className="inline-block p-3 bg-[#b9956f] bg-opacity-20 rounded-full mb-4">
          <Award className="text-[#b9956f]" size={40} />
        </div>
        <h1 className="text-2xl font-bold text-white text-shadow">Bi Rewards</h1>
        <p className="text-gray-200 text-sm text-shadow">Setiap Transaksi, Selalu Ada Apresiasi.</p>
      </div>

      <h2 className="text-xl font-semibold text-center text-white text-shadow">Login to Your Account</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-100 border border-red-200 text-red-700 rounded-md text-sm">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="email-login" className="text-sm font-medium text-gray-200 text-shadow">Email</label>
          <Input
            type="email"
            id="email-login"
            value={email}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
            placeholder="Enter your email"
            leftIcon={<Mail className="h-5 w-5 text-gray-400" />}
            className="w-full"
            required
          />
        </div>
        
        <div>
          <label htmlFor="password-login" className="text-sm font-medium text-gray-200 text-shadow">Password</label>
          <Input
            type={showPassword ? 'text' : 'password'}
            id="password-login"
            value={password}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
            placeholder="Enter your password"
            leftIcon={<Lock className="h-5 w-5 text-gray-400" />}
            rightIcon={showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            onRightIconClick={() => setShowPassword(!showPassword)}
            className="w-full"
            required
          />
        </div>

        <Button type="submit" className="w-full bg-[#b9956ff] hover:bg-[#b9956] text-white flex items-center justify-center gap-2" disabled={isLoading}>
          <LogIn size={16} />
          {isLoading ? 'Logging in...' : 'Login'}
        </Button>

        <div className="text-center">
          <button 
            type="button"
            onClick={onForgotPasswordClick} 
            className="text-sm text-gray-300 hover:underline focus:outline-none text-shadow"
          >
            Forgot Password?
          </button>
        </div>
      </form>
      
      <p className="text-center text-sm text-gray-300 text-shadow">
        Don't have an account?{' '}
        <button onClick={onRegisterClick} className="font-medium text-[#b9956f] hover:underline">
          Register Now
        </button>
      </p>
    </div>
  );
};

export default LoginForm;