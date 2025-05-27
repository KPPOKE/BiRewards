import React, { useState, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import Cropper from 'react-easy-crop';
import Slider from '@mui/material/Slider';
import Modal from '@mui/material/Modal';
import Box from '@mui/material/Box';
import { getCroppedImg } from './cropUtils';

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

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const UserProfilePage: React.FC = () => {
  const { currentUser, setCurrentUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(currentUser?.name || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [phone, setPhone] = useState((currentUser as any)?.phone || '');
  const [profileImage, setProfileImage] = useState((currentUser as any)?.profile_image || '');
  const [newImage, setNewImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [showCropper, setShowCropper] = useState(false);

  const token = (currentUser as any)?.token;
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
      profile_image: (currentUser as any)?.profile_image,
      role: (currentUser as any)?.role,
      points: (currentUser as any)?.points,
      createdAt: (currentUser as any)?.createdAt
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
      setCurrentUser(updatedUser as any);
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
      setNewImage(e.target.files[0]);
      setPreviewUrl(URL.createObjectURL(e.target.files[0]));
      setShowCropper(true);
    }
  };

  const onCropComplete = (_: unknown, croppedAreaPixels: { x: number; y: number; width: number; height: number }) => {
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
    <div className="p-6 max-w-xl mx-auto mt-10 bg-white rounded shadow">
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
            className="w-full mb-4 p-2 border rounded"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Name"
          />
          <input
            className="w-full mb-4 p-2 border rounded"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
          />
          <input
            className="w-full mb-4 p-2 border rounded"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Phone"
          />
          <div className="flex gap-2">
            <button
              onClick={handleUpdate}
              className="bg-blue-600 text-white px-4 py-2 rounded"
            >
              Save
            </button>
            <button
              onClick={() => { setIsEditing(false); setNewImage(null); setPreviewUrl(null); }}
              className="bg-gray-300 px-4 py-2 rounded"
            >
              Cancel
            </button>
          </div>
        </>
      ) : (
        <>
          <p><strong>Name:</strong> {currentUser.name}</p>
          <p><strong>Email:</strong> {currentUser.email}</p>
          <p><strong>Phone:</strong> {(currentUser as any).phone || '-'}</p>
          <button
            onClick={() => setIsEditing(true)}
            className="bg-primary-500 text-white px-4 py-2 rounded mt-4"
          >
            Edit Profile
          </button>
        </>
      )}

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
            <button className="bg-blue-600 text-white px-4 py-2 rounded" onClick={handleCropConfirm}>Crop</button>
            <button className="bg-gray-300 px-4 py-2 rounded" onClick={() => setShowCropper(false)}>Cancel</button>
          </div>
        </Box>
      </Modal>
    </div>
  );
}
export default UserProfilePage;
