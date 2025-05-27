import React from 'react';
import ProfileImageUpload from '../components/ProfileImageUpload';
import Button from '../components/Button';
import { useToast } from '../context/ToastContext';

const Profile = () => {
  const { showToast } = useToast();

  const handleUpload = (image) => {
    // Here you would typically upload the image to your server
    console.log('Uploaded image:', image);
  };

  return (
    <div>
      <h1>Profile</h1>
      <ProfileImageUpload onUpload={handleUpload} />
      <Button onClick={() => showToast('Profile updated', 'success')} ariaLabel="Update Profile">
        Update Profile
      </Button>
    </div>
  );
};

export default Profile; 