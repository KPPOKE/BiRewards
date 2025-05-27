import React, { useState } from 'react';
import Cropper from 'react-easy-crop';
import { useToast } from '../context/ToastContext';

const ProfileImageUpload = ({ onUpload }) => {
  const [image, setImage] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedArea, setCroppedArea] = useState(null);
  const { showToast } = useToast();

  const onFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = () => {
        setImage(reader.result);
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const onCropComplete = (croppedArea, croppedAreaPixels) => {
    setCroppedArea(croppedAreaPixels);
  };

  const handleUpload = async () => {
    if (!croppedArea) {
      showToast('Please crop the image first', 'error');
      return;
    }
    // Here you would typically upload the cropped image to your server
    // For now, we'll just call the onUpload callback with the cropped image
    onUpload(image);
    showToast('Image uploaded successfully', 'success');
  };

  return (
    <div>
      <input type="file" accept="image/*" onChange={onFileChange} />
      {image && (
        <div style={{ position: 'relative', height: 400 }}>
          <Cropper
            image={image}
            crop={crop}
            zoom={zoom}
            aspect={1}
            onCropChange={setCrop}
            onCropComplete={onCropComplete}
            onZoomChange={setZoom}
          />
        </div>
      )}
      <button onClick={handleUpload}>Upload</button>
    </div>
  );
};

export default ProfileImageUpload; 