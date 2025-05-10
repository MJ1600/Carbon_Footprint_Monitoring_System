import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './MachineOperationLogTable.css';

const MachineOperationLogTable = ({ refresh }) => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      setError('');

      try {
        const response = await axios.get('http://localhost:5000/api/machineOperations/logs');
        setLogs(response.data);
      } catch (err) {
        console.error('Error fetching logs:', err);
        setError('Failed to load logs. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, [refresh]); // Refetch logs when refresh prop changes

  const formatDate = (timestamp) => (timestamp ? new Date(timestamp).toLocaleString() : 'N/A');

  return (
    <div className="log-table-container">

      {loading ? (
        <p>Loading logs...</p>
      ) : error ? (
        <p className="error-message">{error}</p>
      ) : (
        <table className="log-table">
          <thead>
            <tr>
              <th>Machine ID</th>
              <th>Employee ID</th>
              <th>Shift Start</th>
              <th>Lunch Break Start</th>
              <th>Lunch Break End</th>
              <th>Shift End</th>
              <th>Machine Status</th>
              <th>Carbon Emission (kg CO2)</th>
            </tr>
          </thead>
          <tbody>
            {logs.length > 0 ? (
              logs.map((log) => (
                <tr key={log._id}>
                  <td>{log.machine_id}</td>
                  <td>{log.employee_id}</td>
                  <td>{formatDate(log.shift_start)}</td>
                  <td>{formatDate(log.lunch_break_start)}</td>
                  <td>{formatDate(log.lunch_break_end)}</td>
                  <td>{formatDate(log.shift_end)}</td>
                  <td>{log.machine_status}</td>
                  <td>{log.carbon_emission?.toFixed(2) || 'N/A'}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="8" className="no-data">No logs available</td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default MachineOperationLogTable;
