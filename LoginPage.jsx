import React, { useState } from 'react';
import axios from 'axios';
import logo from '../assets/logo.png';

function LoginPage({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    const form = new FormData();
    form.append('email', email);
    form.append('password', password);

    const res = await axios.post('http://localhost:8000/login', form);
    if (res.data.status === 'success') {
      onLogin();
    } else {
      setError('❌ Invalid credentials');
    }
  };

  return (
    <div className="login-page">
      <img src={logo} alt="FraudShield Logo" style={{ height: '60px', marginBottom: '20px' }} />
      <h2>🔐 Admin Login</h2>
      <input type="text" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} /><br />
      <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} /><br />
      <button onClick={handleSubmit}>Login</button>
      {error && <p style={{ color: 'red', marginTop: '10px' }}>{error}</p>}
    </div>
  );
}

export default LoginPage;
