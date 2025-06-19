import React, { useEffect, useState } from 'react';
import axios from 'axios';
import GanBarChart from './GanBarChart';
import FraudCard from './FraudCard';
import Footer from './Footer';
import logo from '../assets/logo.png';
import { Link } from 'react-router-dom';

function AdminDashboard({ isLoggedIn }) {
  const [results, setResults] = useState([]);

  useEffect(() => {
    axios.get("http://localhost:8000/fetch-transactions").then(res => {
      setResults(res.data.results);
    });
  }, []);

  const getBlockedAlerts = () =>
    results.filter(r => r.prediction === "Fraud" || r.gan_score > 0.8);

  if (!isLoggedIn) return <div className="App"><h2>Access Denied</h2></div>;

  return (
    <div className="App">
      <div className="header-bar">
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <img src={logo} alt="logo" style={{ height: '40px', marginRight: '10px' }} />
          <h1 style={{ margin: 0 }}>Admin Dashboard</h1>
        </div>
        <Link to="/" className="login-link">⬅ Back</Link>
      </div>

      <GanBarChart results={results} />

      <div className="alert-box">
        <h2>🚨 Fraudulent Transactions</h2>
        <table className="alert-table">
          <thead>
            <tr>
              <th>Payer</th>
              <th>VPA</th>
              <th>Amount</th>
              <th>GAN Score</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {getBlockedAlerts().map((r, i) => (
              <AlertRow key={i} txn={r} />
            ))}
          </tbody>
        </table>
      </div>

      <h2>🧠 Full Transaction Analysis</h2>
      <div className="card-grid">
        {results.map((r, i) => <FraudCard key={i} data={r} />)}
      </div>

      <Footer />
    </div>
  );
}

// 🔁 Independent row component with local status
function AlertRow({ txn }) {
  const [status, setStatus] = useState("Pending");

  return (
    <tr>
      <td>{txn.payer}</td>
      <td>{txn.vpa}</td>
      <td>₹{txn.amount}</td>
      <td>{txn.gan_score}</td>
      <td style={{ fontWeight: 'bold' }}>{status}</td>
      <td>
        <button
          onClick={() => setStatus("Blocked")}
          style={{
            background: 'red',
            color: 'white',
            border: 'none',
            padding: '4px 10px',
            marginRight: '5px',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          🚫 Block
        </button>
        <button
          onClick={() => setStatus("Verified")}
          style={{
            background: 'green',
            color: 'white',
            border: 'none',
            padding: '4px 10px',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          ✅ Verify
        </button>
      </td>
    </tr>
  );
}

export default AdminDashboard;
