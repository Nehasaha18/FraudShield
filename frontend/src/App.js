import React, { useState } from 'react';
import Home from './components/Home';
import Dashboard from './components/Dashboard';
import AdminLogin from './components/AdminLogin';
import AdminDashboard from './components/AdminDashboard';
import './styles/App.css';

function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [uploadedData, setUploadedData] = useState(null);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);

  const showPage = (page) => {
    setCurrentPage(page);
  };

  return (
    <div className="App">
      <div className="animated-bg">
        <div className="particles-container"></div>
      </div>

      <header className="header">
        <div className="logo">
          <img src="/logo.png" alt="FraudShield Logo" style={{ height: '100%', width: 'auto', borderRadius: '4px' }} />
        </div>
        <nav className="nav-links">
          <a href="#" className="nav-link" onClick={() => showPage('home')}>Home</a>
          <a href="#" className="nav-link" onClick={() => showPage('dashboard')}>Dashboard</a>
          <a href="#" className="nav-link" onClick={() => showPage('admin')}>Admin Login</a>
        </nav>
      </header>

      <main className="main-content">
        {currentPage === 'home' && <Home showPage={showPage} />}
        {currentPage === 'dashboard' && <Dashboard data={uploadedData} setData={setUploadedData} />}
        {currentPage === 'admin' && !isAdminLoggedIn && 
          <AdminLogin setIsLoggedIn={setIsAdminLoggedIn} showPage={showPage} />
        }
        {currentPage === 'adminDashboard' && isAdminLoggedIn && 
          <AdminDashboard setIsLoggedIn={setIsAdminLoggedIn} showPage={showPage} />
        }
      </main>
    </div>
  );
}

export default App;