import React from 'react';
import './AnimatedBackground.css';

const AnimatedBackground = () => {
  return (
    <div className="animated-background">
      {/* Circuit board pattern background */}
      <div className="circuit-pattern"></div>
      
      {/* Moving light particles */}
      <div className="light-particles">
        {[...Array(20)].map((_, i) => (
          <div key={i} className={`particle particle-${i + 1}`}></div>
        ))}
      </div>
      
      {/* Animated grid lines */}
      <div className="grid-lines">
        <div className="grid-horizontal"></div>
        <div className="grid-vertical"></div>
      </div>
      
      {/* Welcome text */}
      <div className="welcome-text">
        <h1 className="main-title">
          <span className="word">WELCOME</span>
          <span className="word">TO</span>
          <span className="word">SNAPVERSE</span>
        </h1>
      </div>

      {/* Animated Bubbles */}
      <div className="bubble-container">
        {/* Left Bubble - Darshan */}
        <div className="bubble-wrapper left-bubble">
          <div className="bubble">
            <div className="bubble-inner"></div>
            <div className="bubble-shine"></div>
          </div>
          <div className="bubble-burst">
            <div className="burst-particles">
              {[...Array(12)].map((_, i) => (
                <div key={i} className={`burst-particle particle-${i + 1}`}></div>
              ))}
            </div>
            <div className="name-reveal">DARSHAN</div>
          </div>
        </div>

        {/* Right Bubble - Manjappa */}
        <div className="bubble-wrapper right-bubble">
          <div className="bubble">
            <div className="bubble-inner"></div>
            <div className="bubble-shine"></div>
          </div>
          <div className="bubble-burst">
            <div className="burst-particles">
              {[...Array(12)].map((_, i) => (
                <div key={i} className={`burst-particle particle-${i + 1}`}></div>
              ))}
            </div>
            <div className="name-reveal">MANJAPPA</div>
          </div>
        </div>
      </div>
      
      {/* Current Lines */}
      <div className="current-lines">
        {[...Array(8)].map((_, i) => (
          <div key={i} className={`current-line line-${i + 1}`}>
            <div className="current-spark"></div>
          </div>
        ))}
      </div>

      {/* Glowing orbs */}
      <div className="glowing-orbs">
        <div className="orb orb-1"></div>
        <div className="orb orb-2"></div>
        <div className="orb orb-3"></div>
      </div>
    </div>
  );
};

export default AnimatedBackground;
