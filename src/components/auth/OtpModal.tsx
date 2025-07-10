import React, { useState } from 'react';
import { API_URL } from '../../utils/api';
import Modal from '../ui/ConfirmModal';
import Input from '../ui/Input';
import Button from '../ui/Button';

interface OtpModalProps {
  open: boolean;
  email: string;
  onClose: () => void;
  onSuccess: () => void;
}

const OtpModal: React.FC<OtpModalProps> = ({ open, email, onClose, onSuccess }) => {
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const handleVerify = async () => {
    setError('');
    setSuccessMsg('');
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/users/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp_code: otp })
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMsg('Email verified!');
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 1200);
      } else {
        setError(data.message || 'Verification failed');
      }
    } catch {
      setError('Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      title="Verify Your Email"
      description={`Enter the 6-digit code sent to your email: ${email}`}
      confirmText="Verify"
      cancelText="Cancel"
      onConfirm={handleVerify}
      onCancel={onClose}
    >
      <Input
        label="OTP Code"
        type="text"
        value={otp}
        onChange={e => setOtp(e.target.value)}
        maxLength={6}
        placeholder="Enter OTP"
        fullWidth
      />
      {error && <div className="text-red-600 text-sm mt-2">{error}</div>}
      {successMsg && <div className="text-green-600 text-sm mt-2">{successMsg}</div>}
      <Button fullWidth isLoading={loading} onClick={handleVerify} className="mt-4">
        Verify
      </Button>
    </Modal>
  );
};

export default OtpModal;
