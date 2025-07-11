import React, { useState, useRef } from 'react';
import { useAuth } from '../../context/useAuth';
import Cropper, { Area } from 'react-easy-crop';
import Slider from '@mui/material/Slider';
import Modal from '@mui/material/Modal';
import Box from '@mui/material/Box';
import { getCroppedImg } from './cropUtils';
import { API_URL } from '../../utils/api';

// Extend User type locally for phone and profile_image
interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  profile_image?: string;
  role?: string;
  points?: number;
  createdAt?: string;
}

const UserProfilePage: React.FC = () => {
  const { currentUser, setCurrentUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(currentUser?.name || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [phone, setPhone] = useState(currentUser && 'phone' in currentUser ? (currentUser as UserProfile).phone || '' : '');
  const [profileImage, setProfileImage] = useState(currentUser && 'profile_image' in currentUser ? (currentUser as UserProfile).profile_image || '' : '');
  const [newImage, setNewImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [showCropper, setShowCropper] = useState(false);

  // Password modal state
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Validation state
  const [emailValid, setEmailValid] = useState(true);
  const [phoneValid, setPhoneValid] = useState(true);
  const [newPasswordValid, setNewPasswordValid] = useState(false);
  const [passwordsMatch, setPasswordsMatch] = useState(false);

  const token = (currentUser && typeof currentUser === 'object' && 'token' in currentUser) ? (currentUser as { token: string }).token : undefined;

  // Real-time validation
  React.useEffect(() => {
    setEmailValid(/^\S+@\S+\.\S+$/.test(email));
  }, [email]);

  React.useEffect(() => {
    if (!phone) {
      setPhoneValid(true);
    } else {
      setPhoneValid(/^\+?\d{8,15}$/.test(phone));
    }
  }, [phone]);

  React.useEffect(() => {
    const strong = newPassword ? /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d!@#$%^&*]{8,}$/.test(newPassword) : false;
    setNewPasswordValid(strong);
    setPasswordsMatch(newPassword === confirmPassword && newPassword !== '');
  }, [newPassword, confirmPassword]);

  const handleUpdate = async () => {
    setMessage('');
    // 1. Update name, email, phone
    const response = await fetch(`${API_URL}/users/${currentUser?.id}/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      credentials: 'include',
      body: JSON.stringify({ name, email, phone }),
    });

    let updatedUser: UserProfile = {
      id: currentUser?.id || '',
      name,
      email,
      phone,
      profile_image: currentUser && 'profile_image' in currentUser ? (currentUser as UserProfile).profile_image : undefined,
      role: currentUser && 'role' in currentUser ? (currentUser as UserProfile).role : undefined,
      points: currentUser && 'points' in currentUser ? (currentUser as UserProfile).points : undefined,
      createdAt: currentUser && 'createdAt' in currentUser ? (currentUser as UserProfile).createdAt : undefined
    };

    if (response.ok) {
      const data = await response.json();
      updatedUser = { ...updatedUser, ...data.data };

      // 2. If new image, upload it
      if (newImage) {
        const formData = new FormData();
        formData.append('profile_image', newImage);
        const imgRes = await fetch(`${API_URL}/users/${currentUser?.id}/profile-image`, {
          method: 'POST',
          headers: {
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          },
          credentials: 'include',
          body: formData,
        });
        if (imgRes.ok) {
          const imgData = await imgRes.json();
          updatedUser = { ...updatedUser, profile_image: imgData.data.profile_image };
          setProfileImage(imgData.data.profile_image);
        }
      }

      // Ensure role is always a valid type for User
      if (!updatedUser.role) {
        updatedUser.role = currentUser?.role || 'user';
      }

      setCurrentUser(updatedUser as typeof currentUser);
      setMessage('Profile updated successfully!');
      setIsEditing(false);
      setNewImage(null);
      setPreviewUrl(null);
    } else {
      setMessage('Failed to update profile.');
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setNewImage(file);
      setPreviewUrl(URL.createObjectURL(file));
      setShowCropper(true);
    }
  };

  const onCropComplete = (_: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  const handleCropConfirm = async () => {
    if (previewUrl && croppedAreaPixels) {
      const croppedBlob = await getCroppedImg(previewUrl, croppedAreaPixels);
      if (croppedBlob) {
        const croppedFile = new File([croppedBlob], newImage?.name || 'cropped.jpg', { type: croppedBlob.type });
        setNewImage(croppedFile);
        setPreviewUrl(URL.createObjectURL(croppedFile));
      }
    }
    setShowCropper(false);
  };

  if (!currentUser) return null;

  return (
    <div className="p-6 max-w-xl mx-auto bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">Your Profile</h2>
      {message && <p className={`mb-4 text-sm ${message.includes('success') ? 'text-green-600' : 'text-red-600'}`}>{message}</p>}

      <div className="flex flex-col items-center mb-6">
        <div className="w-24 h-24 rounded-full bg-gray-200 overflow-hidden mb-2 flex items-center justify-center">
          {previewUrl ? (
            <img src={previewUrl} alt="Preview" className="object-cover w-full h-full" />
          ) : profileImage ? (
            <img src={profileImage.startsWith('/') ? profileImage : `/uploads/${profileImage}`} alt="Profile" className="object-cover w-full h-full" />
          ) : (
            <span className="text-4xl text-gray-400">{currentUser.name?.charAt(0)}</span>
          )}
        </div>
        {isEditing && (
          <>
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              className="hidden"
              onChange={handleImageChange}
            />
            <button
              type="button"
              className="text-primary-600 underline text-sm"
              onClick={() => fileInputRef.current?.click()}
            >
              {newImage ? 'Change Image' : 'Upload Image'}
            </button>
          </>
        )}
      </div>

      {isEditing ? (
        <>
          <input
            className={`w-full mb-2 p-2 border rounded flex items-center ${emailValid ? 'border-gray-300' : 'border-red-500'}`}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Name"
          />
          <div className="relative mb-2">
            <input
              className={`w-full p-2 border rounded pr-8 ${emailValid ? 'border-gray-300' : 'border-red-500'}`}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
            />
            {email && (
              <span className={`absolute right-2 top-1/2 transform -translate-y-1/2 text-lg ${emailValid ? 'text-green-600' : 'text-red-500'}`}>{emailValid ? '✔' : '✖'}</span>
            )}
          </div>
          <div className="relative mb-4">
            <input
              className={`w-full p-2 border rounded pr-8 ${phoneValid ? 'border-gray-300' : 'border-red-500'}`}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Phone (e.g., +6281234567890)"
            />
            {phone && (
              <span className={`absolute right-2 top-1/2 transform -translate-y-1/2 text-lg ${phoneValid ? 'text-green-600' : 'text-red-500'}`}>{phoneValid ? '✔' : '✖'}</span>
            )}
          </div>
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setShowPasswordModal(true)}
              className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded shadow"
              type="button"
            >
              Change Password
            </button>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleUpdate}
              className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
              disabled={!emailValid || !phoneValid || !name}
            >
              Save
            </button>
            <button
              onClick={() => { setIsEditing(false); setNewImage(null); setPreviewUrl(null); }}
              className="bg-gray-300 px-4 py-2 rounded"
              type="button"
            >
              Cancel
            </button>
          </div>
        </>
      ) : (
        <>
          <p><strong>Name:</strong> {currentUser.name}</p>
          <p><strong>Email:</strong> {currentUser.email}</p>
          <p><strong>Phone:</strong> {currentUser && typeof currentUser === 'object' && 'phone' in currentUser ? (currentUser as { phone?: string }).phone || '-' : '-'}</p>
          <button
            onClick={() => setIsEditing(true)}
            className="bg-primary-500 text-white px-4 py-2 rounded mt-4"
            type="button"
          >
            Edit Profile
          </button>
        </>
      )}

      {/* Password Modal */}
      <Modal open={showPasswordModal} onClose={() => { setShowPasswordModal(false); setCurrentPassword(''); setNewPassword(''); setConfirmPassword(''); setPasswordMessage(''); }}>
        <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 400, bgcolor: 'background.paper', boxShadow: 24, p: 3, borderRadius: 2 }}>
          <h3 className="text-lg font-semibold mb-4">Change Password</h3>
          <div className="mb-3">
            <label className="block text-sm mb-1">Current Password</label>
            <div className="relative">
              <input
                type={showCurrent ? 'text' : 'password'}
                className="w-full p-2 border rounded pr-10"
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
              />
              <button type="button" className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm" onClick={() => setShowCurrent(v => !v)}>{showCurrent ? 'Hide' : 'Show'}</button>
            </div>
          </div>
          <div className="mb-3">
            <label className="block text-sm mb-1">New Password</label>
            <div className="relative">
              <input
                type={showNew ? 'text' : 'password'}
                className={`w-full p-2 border rounded pr-10 ${newPassword && !newPasswordValid ? 'border-red-500' : ''}`}
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
              />
              <button type="button" className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm" onClick={() => setShowNew(v => !v)}>{showNew ? 'Hide' : 'Show'}</button>
            </div>
            {newPassword && !newPasswordValid && (
              <p className="text-xs text-red-500 mt-1">Min 8 chars, 1 letter & 1 number</p>
            )}
          </div>
          <div className="mb-3">
            <label className="block text-sm mb-1">Confirm New Password</label>
            <div className="relative">
              <input
                type={showConfirm ? 'text' : 'password'}
                className={`w-full p-2 border rounded pr-10 ${confirmPassword && !passwordsMatch ? 'border-red-500' : ''}`}
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
              />
              <button type="button" className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm" onClick={() => setShowConfirm(v => !v)}>{showConfirm ? 'Hide' : 'Show'}</button>
            </div>
            {confirmPassword && !passwordsMatch && (
              <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
            )}
          </div>
          {passwordMessage && <p className={`mb-2 text-sm ${passwordMessage.includes('success') ? 'text-green-600' : 'text-red-600'}`}>{passwordMessage}</p>}
          <div className="flex gap-2 justify-end mt-4">
            <button className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50" type="button" disabled={passwordLoading || !currentPassword || !newPasswordValid || !passwordsMatch} onClick={async () => {
              setPasswordLoading(true);
              setPasswordMessage('');
              try {
                const res = await fetch(`${API_URL}/users/change-password`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                  },
                  credentials: 'include',
                  body: JSON.stringify({ current_password: currentPassword, new_password: newPassword })
                });
                const data = await res.json();
                if (res.ok) {
                  setPasswordMessage('Password changed successfully!');
                  setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
                } else {
                  setPasswordMessage(data.message || 'Failed to change password');
                }
              } catch (err) {
                console.error('Failed to change password:', err);
                setPasswordMessage('Failed to change password');
              } finally {
                setPasswordLoading(false);
              }
            }}>
              {passwordLoading ? 'Saving...' : 'Save'}
            </button>
            <button className="bg-gray-300 px-4 py-2 rounded" type="button" onClick={() => { setShowPasswordModal(false); setCurrentPassword(''); setNewPassword(''); setConfirmPassword(''); setPasswordMessage(''); }}>Cancel</button>
          </div>
        </Box>
      </Modal>

      {/* Cropper Modal */}
      <Modal open={showCropper} onClose={() => setShowCropper(false)}>
        <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 350, bgcolor: 'background.paper', boxShadow: 24, p: 2, borderRadius: 2 }}>
          <div style={{ position: 'relative', width: 300, height: 300, background: '#333' }}>
            <Cropper
              image={previewUrl || ''}
              crop={crop}
              zoom={zoom}
              aspect={1}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
            />
          </div>
          <div className="my-2">
            <Slider
              value={zoom}
              min={1}
              max={3}
              step={0.1}
              onChange={(_: Event, value: number | number[]) => setZoom(value as number)}
            />
          </div>
          <div className="flex gap-2 justify-end">
            <button className="bg-blue-600 text-white px-4 py-2 rounded" type="button" onClick={handleCropConfirm}>Crop</button>
            <button className="bg-gray-300 px-4 py-2 rounded" type="button" onClick={() => setShowCropper(false)}>Cancel</button>
          </div>
        </Box>
      </Modal>
    </div>
  );
};

export default UserProfilePage;
