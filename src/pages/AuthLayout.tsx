import { useState, useEffect, ReactNode } from 'react';

import restaurant1 from '../assets/images/restaurant1.jpg';
import restaurant2 from '../assets/images/restaurant2.jpg';
import restaurant3 from '../assets/images/restaurant3.jpg';

const backgroundImages = [
  restaurant1,
  restaurant2,
  restaurant3
];

interface AuthLayoutProps {
  children: ReactNode;
}

const AuthLayout = ({ children }: AuthLayoutProps) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex(prevIndex => (prevIndex + 1) % backgroundImages.length);
    }, 5000); // Change image every 5 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative h-screen w-screen overflow-hidden">
      {backgroundImages.map((image, index) => (
        <div
          key={image}
          className={`absolute top-0 left-0 h-full w-full bg-cover bg-center transition-opacity duration-1000 ${index === currentImageIndex ? 'opacity-100' : 'opacity-0'}`}
          style={{ backgroundImage: `url(${image})` }}
        />
      ))}
      <div className="absolute top-0 left-0 h-full w-full bg-black bg-opacity-60"></div>
      <div className="relative z-10 flex h-full w-full items-center justify-center px-4">
        {children}
      </div>
    </div>
  );
};

export default AuthLayout;
