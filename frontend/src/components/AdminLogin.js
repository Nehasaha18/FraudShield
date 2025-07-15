import React, { useState } from 'react';
import api from '../api'; // Fixed import path

const AdminLogin = ({ setIsLoggedIn, showPage }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      // Create FormData for OAuth2 login (as expected by FastAPI)
      const formData = new FormData();
      formData.append('username', username);
      formData.append('password', password);
      
      const response = await api.post('/auth/token', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.access_token) {
        localStorage.setItem('access_token', response.data.access_token);
        setIsLoggedIn(true);
        showPage('adminDashboard');
      }
    } catch (error) {
      console.error('Login error:', error);
      if (error.response?.status === 429) {
        setError('Too many login attempts. Please try again later.');
      } else if (error.response?.status === 401) {
        setError('Invalid credentials. Please try again.');
      } else {
        setError('Connection failed. Please check if the backend is running.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="admin" className="page active">
      <div className="admin-login">
        <div className="admin-logo">
          <img src="/centralbank.png" alt="Central Bank Logo" style={{ width: '100%', height: '100%', borderRadius: '12px' }} />
        </div>
        <h2>Central Bank of India</h2>
        <h3>Admin Portal</h3>
        
        <form className="login-form" onSubmit={handleAdminLogin}>
          {error && (
            <div style={{ color: '#ef4444', marginBottom: '1rem', textAlign: 'center' }}>
              {error}
            </div>
          )}
          <div className="form-group">
            <label className="form-label">Username</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="Enter Username" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required 
              disabled={loading}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input 
              type="password" 
              className="form-input" 
              placeholder="Enter Password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required 
              disabled={loading}
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        
        <div style={{ marginTop: '1rem', color: '#64748b', fontSize: '0.9rem', textAlign: 'center' }}>
          <p>Test Credentials:</p>
          <p><strong>Admin:</strong> centralbank / admin123</p>
          <p><strong>Analyst:</strong> analyst / analyst123</p>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;