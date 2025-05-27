import React, { useEffect } from 'react';
import { useToast } from '../context/ToastContext';

const Toast = () => {
  const { toast, hideToast } = useToast();

  useEffect(() => {
    if (toast.visible) {
      const timer = setTimeout(() => {
        hideToast();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toast.visible, hideToast]);

  if (!toast.visible) return null;

  return (
    <div className={`fixed top-4 right-4 p-4 rounded shadow-lg ${toast.type === 'success' ? 'bg-green-500' : toast.type === 'error' ? 'bg-red-500' : 'bg-blue-500'} text-white`}>
      {toast.message}
    </div>
  );
};

export default Toast; 