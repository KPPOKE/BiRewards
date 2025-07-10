import React, { useState } from 'react';
import api from '../../utils/api';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Card, { CardHeader, CardTitle, CardContent, CardFooter } from '../ui/Card';
import { Mail, KeyRound, ShieldCheck } from 'lucide-react';

interface ApiError {
  response?: {
    data: {
      message: string;
    };
  };
}

interface ForgotPasswordFormProps {
  onLoginClick: () => void;
}

const ForgotPasswordForm: React.FC<ForgotPasswordFormProps> = ({ onLoginClick }) => {
  const [step, setStep] = useState(1); // 1: Enter email, 2: Enter OTP and new password
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setMessage('');
    try {
      const response = await api.post('/users/forgot-password', { email });
      if (response.success) {
        setMessage(response.message);
        setStep(2);
      } else {
        setError(response.message || 'Failed to send OTP.');
      }
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.response?.data?.message || 'An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setMessage('');
    try {
      const response = await api.post('/users/reset-password', { email, otp, newPassword });
      if (response.success) {
        setMessage(response.message);
        setTimeout(() => onLoginClick(), 2000); // Redirect to login after 2 seconds
      } else {
        setError(response.message || 'Failed to reset password.');
      }
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.response?.data?.message || 'An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-center text-2xl">Reset Password</CardTitle>
      </CardHeader>
      <CardContent>
        {message && (
          <div className="p-3 bg-green-100 border border-green-200 text-green-700 rounded-md text-sm mb-4">
            {message}
          </div>
        )}
        {error && (
          <div className="p-3 bg-red-100 border border-red-200 text-red-700 rounded-md text-sm mb-4">
            {error}
          </div>
        )}

        {step === 1 ? (
          <form onSubmit={handleRequestOtp} className="space-y-4">
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your registered email"
              fullWidth
              leftIcon={<Mail size={18} />}
              required
            />
            <Button type="submit" fullWidth isLoading={isLoading}>
              Send OTP
            </Button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <Input
              label="OTP"
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="Enter the OTP from your email"
              fullWidth
              leftIcon={<ShieldCheck size={18} />}
              required
            />
            <Input
              label="New Password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter your new password"
              fullWidth
              leftIcon={<KeyRound size={18} />}
              required
            />
            <Button type="submit" fullWidth isLoading={isLoading}>
              Reset Password
            </Button>
          </form>
        )}
      </CardContent>
      <CardFooter className="flex justify-center">
        <p className="text-sm text-gray-600">
          Remember your password?{' '}
          <button
            onClick={onLoginClick}
            className="text-black hover:text-primary-500 font-medium"
            type="button"
          >
            Back to Login
          </button>
        </p>
      </CardFooter>
    </Card>
  );
};

export default ForgotPasswordForm;
