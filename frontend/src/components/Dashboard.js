import React, { useState } from 'react';
import axios from 'axios';
import NetworkGraph from './NetworkGraph';
import api from '../api';

const Dashboard = ({ data, setData }) => {
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState('');
  const [showGraph, setShowGraph] = useState(false);

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file || !file.name.endsWith('.csv')) {
      alert('Please upload a CSV file');
      return;
    }

    setFileName(file.name);
    setLoading(true);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await api.post('/detect/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setData(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error:', error);
      alert('Error processing file. Please check if the backend is running.');
      setLoading(false);
    }
  };

  const blockTransaction = (index) => {
    const statusElement = document.getElementById(`status-${index}`);
    const alertElement = document.getElementById(`alert-${index}`);
    
    if (statusElement) {
      statusElement.textContent = 'Transaction Blocked';
      statusElement.style.color = '#ef4444';
      alertElement.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
      alertElement.style.borderColor = 'rgba(239, 68, 68, 0.3)';
    }
  };

  const verifyTransaction = (index) => {
    const statusElement = document.getElementById(`status-${index}`);
    const alertElement = document.getElementById(`alert-${index}`);
    
    if (statusElement) {
      statusElement.textContent = 'Transaction Verified';
      statusElement.style.color = '#22c55e';
      alertElement.style.backgroundColor = 'rgba(34, 197, 94, 0.1)';
      alertElement.style.borderColor = 'rgba(34, 197, 94, 0.3)';
    }
  };

  return (
    <div id="dashboard" className="page active">
      <div className="dashboard">
        <div className="dashboard-header">
          <h2 className="dashboard-title">Fraud Detection Dashboard</h2>
          <div className="status-indicator">
            <span className="status-dot active"></span>
            <span>System Active</span>
          </div>
        </div>

        {/* Statistics Grid */}
        {data && (
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-value">{data.total_transactions}</div>
              <div className="stat-label">Total Transactions</div>
            </div>
            <div className="stat-card">
              <div className="stat-value fraud-stat">{data.fraud_detected}</div>
              <div className="stat-label">Fraud Detected</div>
            </div>
            <div className="stat-card">
              <div className="stat-value success-stat">{data.total_transactions - data.fraud_detected}</div>
              <div className="stat-label">Legitimate Transactions</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">
                {((data.total_transactions - data.fraud_detected) / data.total_transactions * 100).toFixed(1)}%
              </div>
              <div className="stat-label">Detection Accuracy</div>
            </div>
          </div>
        )}

        {/* Upload Section */}
        {!data && !loading && (
          <div className="upload-section">
            <div className="upload-icon">📄</div>
            <h3>Upload Transaction Data</h3>
            <p>Drag and drop your CSV file here or click to browse</p>
            <input 
              type="file" 
              id="fileInput" 
              className="file-input" 
              accept=".csv" 
              onChange={handleFileUpload}
            />
            <button className="upload-btn" onClick={() => document.getElementById('fileInput').click()}>
              Choose File
            </button>
            {fileName && <div className="file-name">Selected: {fileName}</div>}
          </div>
        )}

        {/* Loading Status */}
        {loading && (
          <div className="loading">
            <div className="spinner"></div>
            <p>Processing transactions with AI algorithms...</p>
          </div>
        )}

        {/* Network Graph Toggle */}
        {data && (
          <div style={{ textAlign: 'center', margin: '20px 0' }}>
            <button 
              className="btn btn-primary" 
              onClick={() => setShowGraph(!showGraph)}
            >
              {showGraph ? 'Hide' : 'Show'} Network Graph
            </button>
          </div>
        )}

        {/* Network Graph */}
        {data && showGraph && (
          <div style={{ marginBottom: '2rem' }}>
            <NetworkGraph graphData={data.graph_data} />
          </div>
        )}

        {/* Fraud Alerts */}
        {data && data.fraud_transactions.length > 0 && (
          <div className="fraud-alerts">
            <div className="alerts-header">
              <h3>🚨 Fraud Alerts</h3>
              <span className="alert-count">{data.fraud_transactions.length} alerts</span>
            </div>
            <div id="alertsList">
              {data.fraud_transactions.slice(0, 10).map((txn, index) => (
                <div className="alert-item" id={`alert-${index}`} key={index}>
                  <div className="alert-info">
                    <div className="alert-details">
                      <div className="alert-transaction">
                        {txn.payer_vpa} → {txn.beneficiary_vpa}
                      </div>
                      <div className="alert-reason">{txn.explanation}</div>
                      <div className="alert-amount">Amount: ₹{txn.amount.toLocaleString()}</div>
                    </div>
                  </div>
                  <div className="alert-actions">
                    <button className="btn-block" onClick={() => blockTransaction(index)}>Block</button>
                    <button className="btn-verify" onClick={() => verifyTransaction(index)}>Verify</button>
                  </div>
                  <div className="status-text" id={`status-${index}`}></div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;