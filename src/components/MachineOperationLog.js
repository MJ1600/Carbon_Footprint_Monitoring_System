import React, { useState } from 'react';
import MachineOperationForm from './MachineOperationForm';
import MachineOperationLogTable from './MachineOperationLogTable';
import './MachineOperationLog.css';

const MachineOperationLog = () => {
  const [refresh, setRefresh] = useState(false); // State to trigger table refresh

  return (
    <div className="machine-operation-log">
      <header className="machine-operation-log-header">
        <h1>Machine Operation Log</h1>
      </header>

      <main>
        {/* Form to add machine operation logs */}
        <MachineOperationForm setRefresh={setRefresh} />

        {/* Log table displayed BELOW the form */}
        <div className="log-table-section">
          <h2>Operation Logs</h2>
          <MachineOperationLogTable refresh={refresh} />
        </div>
      </main>
    </div>
  );
};

export default MachineOperationLog;
