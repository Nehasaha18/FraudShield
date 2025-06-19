import React, { useState } from 'react'; 
import axios from 'axios';
import GanBarChart from './GanBarChart';
import FraudCard from './FraudCard';
import Footer from './Footer';
import logo from './assets/logo.png';
import { Link } from 'react-router-dom';

function UploadDashboard() {
  const [file, setFile] = useState(null);
  const [results, setResults] = useState([]);

  const handleUpload = async () => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await axios.post("http://localhost:8000/upload", formData);
    setResults(res.data.results);
  };

  const getBlockedAlerts = () =>
    results.filter(r => r.prediction === "Fraud" || r.gan_score > 0.8);

  return (
    <div className="App">
      {/* Header Section */}
      <div className="header-bar">
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <img src={logo} alt="FraudShield Logo" style={{ height: '40px', marginRight: '10px' }} />
          <h1 style={{ margin: 0 }}>🛡️ FraudShield: Transaction Analyzer</h1>
        </div>
        <Link to="/admin" className="login-link">🔐 Admin Login</Link>
      </div>

      {/* Upload Section */}
      <div className="upload-box">
        <h2>📁 Upload Transaction Dataset</h2>
        <input
          type="file"
          onChange={(e) => setFile(e.target.files[0])}
          style={{ fontSize: '16px' }}
        />
        <button className="upload-btn" onClick={handleUpload}>
          🚀 Run Real-Time Analysis
        </button>
      </div>

      {/* Analysis Results */}
      {results.length > 0 && (
        <>
          {/* Visualization */}
          <GanBarChart results={results} />

          {/* Blocked Alerts */}
          <div className="alert-box">
            <h2>🚨 High-Risk Transaction Alerts</h2>
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

          {/* All Transactions */}
          <h2>🧠 Complete Neural Analysis</h2>
          <div className="card-grid">
            {results.map((r, i) => (
              <FraudCard key={i} data={r} />
            ))}
          </div>
        </>
      )}

      <Footer />
    </div>
  );
}

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

export default UploadDashboard;
