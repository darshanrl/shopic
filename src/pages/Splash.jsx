import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Camera } from 'lucide-react';
import './Splash.css';

export default function Splash() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [fadingOut, setFadingOut] = useState(false);

  useEffect(() => {
    // Wait for auth to finish loading AND animation to complete (approx 3 seconds total)
    // 0.8s wait + 1.5s reveal + a bit of reading time = 3000ms
    const splashTimeout = setTimeout(() => {
      // Start fade out animation
      setFadingOut(true);
      
      // Wait for fade out animation (0.8s) before routing
      setTimeout(() => {
        if (!loading) {
          if (user) {
            navigate('/dashboard', { replace: true });
          } else {
            navigate('/login', { replace: true });
          }
        }
      }, 700); 
    }, 2800);

    return () => clearTimeout(splashTimeout);
  }, [user, loading, navigate]);

  return (
    <div className={`splash-container ${fadingOut ? 'fade-out' : ''}`}>
      {/* Background Particles */}
      {[...Array(5)].map((_, i) => (
        <div key={i} className="splash-particle"></div>
      ))}
      
      <div className="splash-content">
        <div className="camera-icon-container shadow-2xl shadow-purple-500/50">
          <Camera className="camera-icon" strokeWidth={2.5} />
        </div>
        <div className="splash-text-container">
          <h1 className="splash-text">SHOPIC</h1>
        </div>
      </div>
    </div>
  );
}
