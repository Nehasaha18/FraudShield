import React, { useEffect } from 'react';

const Home = ({ showPage }) => {
  useEffect(() => {
    // Initialize particles
    const container = document.querySelector('.particles-container');
    if (!container) return;

    const createParticle = () => {
      const particle = document.createElement('div');
      particle.className = 'particle';
      particle.style.left = Math.random() * 100 + '%';
      particle.style.width = Math.random() * 4 + 2 + 'px';
      particle.style.height = particle.style.width;
      particle.style.animationDuration = Math.random() * 10 + 10 + 's';
      particle.style.animationDelay = Math.random() * 2 + 's';
      
      container.appendChild(particle);
      
      setTimeout(() => {
        particle.remove();
      }, 20000);
    };

    const interval = setInterval(createParticle, 300);
    return () => clearInterval(interval);
  }, []);

  return (
    <div id="home" className="page active">
      <div className="home-hero">
        <h1 className="hero-title">FraudShield</h1>
        <p className="hero-subtitle">Adaptive Explainable AI Web Platform for Real-Time Fraud Detection</p>
        <p className="hero-tagline">Detect | Explain | Protect</p>
        
        <div className="hero-buttons">
          <button className="btn btn-primary" onClick={() => showPage('dashboard')}>
            <span>🛡️</span> Start Fraud Detection
          </button>
          <button className="btn btn-secondary" onClick={() => showPage('admin')}>
            <span>👤</span> Admin Login
          </button>
        </div>

        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">⚡</div>
            <h3>Instant Fraud Watch</h3>
            <p>Real-time transaction monitoring with AI-powered analysis</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🔄</div>
            <h3>Dynamic Graph Engine</h3>
            <p>Adaptive graph updates for evolving fraud patterns</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🧠</div>
            <h3>AI Neural Analysis</h3>
            <p>Advanced GraphGAN and GraphSAGE algorithms</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📊</div>
            <h3>Explainable AI</h3>
            <p>Clear insights with SHAP and LIME explanations</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;