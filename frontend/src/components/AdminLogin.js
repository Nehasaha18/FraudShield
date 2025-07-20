import React, { useState } from 'react';
import axios from 'axios';
import api from '../api';

const AdminLogin = ({ setIsLoggedIn, showPage }) => {
  const [adminId, setAdminId] = useState('');
  const [password, setPassword] = useState('');

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    
    try {
      const params = new URLSearchParams();
      params.append('username', adminId);
      params.append('password', password);
      params.append('grant_type', '');
      const response = await api.post('/auth/token', params, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });
      if (response.data.access_token) {
        localStorage.setItem('access_token', response.data.access_token);
        setIsLoggedIn(true);
        showPage('adminDashboard');
      }
    } catch (error) {
      alert('Invalid credentials. Please try again.');
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
          <div className="form-group">
            <label className="form-label">Admin ID</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="Enter Admin ID" 
              value={adminId}
              onChange={(e) => setAdminId(e.target.value)}
              required 
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
            />
          </div>
          <button type="submit" className="btn btn-primary">Login</button>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;