import React, { useState } from 'react';
import { useAuth } from '../../context/useAuth';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Card, { CardHeader, CardTitle, CardContent, CardFooter } from '../ui/Card';
import { Mail, Lock, User, UserPlus, Phone, Eye, EyeOff } from 'lucide-react';
import OtpModal from './OtpModal';
import PasswordStrengthMeter from './PasswordStrengthMeter';

interface RegisterFormProps {
  onSuccess?: () => void;
  onLoginClick: () => void;
}

const RegisterForm: React.FC<RegisterFormProps> = ({ onSuccess, onLoginClick }) => {
  const { register, isLoading } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [otpModalOpen, setOtpModalOpen] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Form validation
    if (!name || !email || !phone || !password || !confirmPassword) {
      setError('All fields are required');
      return;
    }
    // Simple phone validation
    if (!/^\+?\d{8,15}$/.test(phone)) {
      setError('Please enter a valid phone number');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    try {
      const success = await register(name, email, phone, password);
      if (success) {
        setRegisteredEmail(email);
        setOtpModalOpen(true);
        // DO NOT call onSuccess() here. Only after OTP verified!
      } else {
        setError('Email or phone already in use or registration failed');
      }
    } catch {
      setError('Registration failed. Please try again.');
    }
  };

  return (
    <>
      <Card className="w-full max-w-md mx-auto animate-fadeIn">
      <CardHeader>
        <CardTitle className="text-center text-2xl text-white text-shadow">Create an Account</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-100 border border-red-200 text-red-700 rounded-md text-sm">
              {error}
            </div>
          )}
          
          <Input
            label="Full Name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your full name"
            fullWidth
            leftIcon={<User size={18} />}
            required
          />
          <Input
            label="Phone Number"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Enter your phone number"
            fullWidth
            leftIcon={<Phone size={18} />} // Changed to phone icon
            required
          />
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
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Create a password"
            helperText="Password must be at least 6 characters. Use upper, lower, numbers, and symbols."
            fullWidth
            leftIcon={<Lock size={18} />}
            rightIcon={showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            onRightIconClick={() => setShowPassword(!showPassword)}
            required
          />
          <PasswordStrengthMeter password={password} />
          
          <Input
            label="Confirm Password"
            type={showConfirmPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm your password"
            fullWidth
            leftIcon={<Lock size={18} />}
            rightIcon={showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            onRightIconClick={() => setShowConfirmPassword(!showConfirmPassword)}
            required
          />
          
          <Button 
            type="submit" 
            fullWidth 
            isLoading={isLoading}
            leftIcon={<UserPlus size={18} />}
          >
            Register
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex justify-center">
        <p className="text-sm text-gray-300 text-shadow">
          Already have an account?{' '}
          <button
            onClick={onLoginClick}
            className="font-medium text-[#b9956f] hover:underline"
            type="button"
          >
            Login
          </button>
        </p>
      </CardFooter>
    </Card>
    <OtpModal
      open={otpModalOpen}
      email={registeredEmail}
      onClose={() => setOtpModalOpen(false)}
      onSuccess={onSuccess || (() => {})}
    />
    </>
  );
};

export default RegisterForm;