import React from 'react';
import logo from '../assets/logo.png';

function Header() {
  return (
    <div className="header">
      <img src={logo} alt="FraudShield" className="header-logo" />
      <h1>FraudShield AI Dashboard</h1>
    </div>
  );
}

export default Header;
