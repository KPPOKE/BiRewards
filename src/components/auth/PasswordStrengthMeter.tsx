import React from 'react';

interface PasswordStrengthMeterProps {
  password?: string;
}

const PasswordStrengthMeter: React.FC<PasswordStrengthMeterProps> = ({ password = '' }) => {
  const calculateStrength = () => {
    let score = 0;
    if (password.length >= 8) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^a-zA-Z0-9]/.test(password)) score++;
    return score;
  };

  const strength = calculateStrength();
  const strengthLabels = ['Too Weak', 'Weak', 'Medium', 'Strong', 'Very Strong'];
  const strengthColors = [
    'bg-red-500',
    'bg-orange-500',
    'bg-yellow-500',
    'bg-blue-500',
    'bg-green-500',
  ];

  const getStrengthProps = () => {
    if (strength <= 1) return { label: strengthLabels[0], color: strengthColors[0], width: '20%' };
    if (strength === 2) return { label: strengthLabels[1], color: strengthColors[1], width: '40%' };
    if (strength === 3) return { label: strengthLabels[2], color: strengthColors[2], width: '60%' };
    if (strength === 4) return { label: strengthLabels[3], color: strengthColors[3], width: '80%' };
    if (strength >= 5) return { label: strengthLabels[4], color: strengthColors[4], width: '100%' };
    return { label: '', color: 'bg-gray-200', width: '0%' };
  };

  const { label, color, width } = getStrengthProps();

  if (!password) return null;

  return (
    <div className="mt-2">
      <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-300 ease-in-out ${color}`}
          style={{ width }}
        ></div>
      </div>
      <p className={`text-xs mt-1 text-right font-medium ${color.replace('bg-', 'text-')}`}>
        {label}
      </p>
    </div>
  );
};

export default PasswordStrengthMeter;
