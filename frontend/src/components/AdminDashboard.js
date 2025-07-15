import React, { useState, useEffect } from 'react';
import api from '../api'; // Use the configured API instance
import NetworkGraph from './NetworkGraph';

const AdminDashboard = ({ setIsLoggedIn, showPage }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showGraph, setShowGraph] = useState(false);
  const [error, setError] = useState('');

  const loadBackendData = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/admin/data/');
      setData(response.data);
    } catch (error) {
      console.error('Error loading data:', error);
      if (error.response?.status === 401) {
        setError('Session expired. Please login again.');
        logout();
      } else {
        setError('Error loading data. Please ensure the backend is running.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBackendData();
  }, []);

  const handleTransactionAction = async (transactionId, action) => {
    try {
      await api.post('/admin/transaction-action/', {
        transaction_id: transactionId,
        action: action
      });
      
      // Update local state
      const updatedData = { ...data };
      const txn = updatedData.fraud_transactions.find(t => t.transaction_id === transactionId);
      if (txn) {
        txn.status = action;
      }
      setData(updatedData);
      
      alert(`Transaction ${action === 'blocked' ? 'blocked' : 'verified'} successfully`);
    } catch (error) {
      console.error('Error updating transaction:', error);
      if (error.response?.status === 401) {
        logout();
      } else {
        alert('Error updating transaction status');
      }
    }
  };

  const generateReport = async () => {
    try {
      const response = await api.get('/admin/generate-report/', {
        responseType: 'blob'
      });
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `fraud_report_${new Date().toISOString().split('T')[0]}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      alert('Report generated successfully!');
    } catch (error) {
      console.error('Error generating report:', error);
      if (error.response?.status === 401) {
        logout();
      } else {
        alert('Error generating report');
      }
    }
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    setIsLoggedIn(false);
    showPage('home');
  };

  if (error) {
    return (
      <div id="adminDashboard" className="page active">
        <div className="dashboard">
          <div className="dashboard-header">
            <h2 className="dashboard-title">Central Bank Admin Dashboard</h2>
            <button className="btn btn-secondary" onClick={logout}>Logout</button>
          </div>
          <div style={{ 
            textAlign: 'center', 
            color: '#ef4444', 
            marginTop: '2rem',
            padding: '2rem',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            borderRadius: '8px'
          }}>
            <h3>Error</h3>
            <p>{error}</p>
            <button className="btn btn-primary" onClick={loadBackendData}>
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div id="adminDashboard" className="page active">
      <div className="dashboard">
        <div className="dashboard-header">
          <h2 className="dashboard-title">Central Bank Admin Dashboard</h2>
          <button className="btn btn-secondary" onClick={logout}>Logout</button>
        </div>

        {data && (
          <>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-value">{data.total_transactions}</div>
                <div className="stat-label">Total Transactions Monitored</div>
              </div>
              <div className="stat-card">
                <div className="stat-value fraud-stat">{data.fraud_detected}</div>
                <div className="stat-label">Fraud Cases Detected</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{data.blocked_accounts || 0}</div>
                <div className="stat-label">Accounts Blocked</div>
              </div>
              <div className="stat-card">
                <div className="stat-value success-stat">{data.system_health}%</div>
                <div className="stat-label">System Health</div>
              </div>
            </div>

            <div className="admin-actions">
              <button className="btn btn-primary" onClick={loadBackendData}>
                Refresh Data
              </button>
              <button className="btn btn-secondary" onClick={generateReport}>
                Generate Report
              </button>
              <button 
                className="btn btn-primary" 
                onClick={() => setShowGraph(!showGraph)}
              >
                {showGraph ? 'Hide' : 'Show'} Network Graph
              </button>
            </div>

            {showGraph && data.graph_data && (
              <div style={{ marginBottom: '2rem' }}>
                <NetworkGraph graphData={data.graph_data} />
              </div>
            )}

            {data.fraud_transactions && data.fraud_transactions.length > 0 && (
              <div className="fraud-alerts">
                <div className="alerts-header">
                  <h3>🔴 Critical Fraud Alerts</h3>
                  <span className="alert-count">{data.fraud_transactions.length} critical alerts</span>
                </div>
                <div className="alerts-list">
                  {data.fraud_transactions.slice(0, 15).map((txn, index) => (
                    <div className="alert-item" key={index}>
                      <div className="alert-info">
                        <div className="alert-details">
                          <div className="alert-transaction">
                            ID: {txn.transaction_id}
                          </div>
                          <div className="alert-reason">{txn.explanation}</div>
                          <div className="alert-amount">
                            {txn.payer_vpa} → {txn.beneficiary_vpa} 
                            (₹{txn.amount.toLocaleString()})
                          </div>
                          {txn.status && (
                            <div className="status-text" style={{
                              color: txn.status === 'blocked' ? '#ef4444' : '#22c55e'
                            }}>
                              Status: {txn.status.charAt(0).toUpperCase() + txn.status.slice(1)}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="alert-actions">
                        <button 
                          className="btn-block" 
                          onClick={() => handleTransactionAction(txn.transaction_id, 'blocked')}
                          disabled={txn.status === 'blocked'}
                        >
                          Block Account
                        </button>
                        <button 
                          className="btn-verify" 
                          onClick={() => handleTransactionAction(txn.transaction_id, 'verified')}
                          disabled={txn.status === 'verified'}
                        >
                          Mark Safe
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {loading && (
          <div className="loading">
            <div className="spinner"></div>
            <p>Loading backend data...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;