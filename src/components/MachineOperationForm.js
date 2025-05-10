import React, { useReducer } from 'react';
import axios from 'axios';
import './MachineOperationForm.css';

const initialState = {
  machineId: '',
  employeeId: '',
  shiftStart: '',
  lunchBreakStart: '',
  lunchBreakEnd: '',
  shiftEnd: '',
  machineStatus: '',
  isShiftRunning: false,
  isLunchBreak: false,
};

const reducer = (state, action) => {
  switch (action.type) {
    case 'SET_INPUT':
      return { ...state, [action.field]: action.value };
    case 'START_SHIFT':
      return { ...state, shiftStart: new Date().toISOString(), isShiftRunning: true, machineStatus: 'running' };
    case 'START_LUNCH':
      return { ...state, lunchBreakStart: new Date().toISOString(), isLunchBreak: true, machineStatus: 'stopped' };
    case 'END_LUNCH':
      return { ...state, lunchBreakEnd: new Date().toISOString(), isLunchBreak: false, machineStatus: 'running' };
    case 'END_SHIFT':
      return { ...state, shiftEnd: new Date().toISOString(), isShiftRunning: false, machineStatus: 'stopped' };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
};

const MachineOperationForm = ({ setRefresh }) => {
  const [state, dispatch] = useReducer(reducer, initialState);

  const handleChange = (e) => {
    dispatch({ type: 'SET_INPUT', field: e.target.name, value: e.target.value });
  };

  const handleSubmit = async (shiftEndTime) => {
    if (!state.employeeId) {
      alert('Please enter the Employee ID.');
      return;
    }

    const shiftStartTime = new Date(state.shiftStart);
    shiftEndTime = new Date(shiftEndTime); // Use updated shiftEndTime

    // Ensure shift end time is later than shift start time
    if (shiftEndTime <= shiftStartTime) {
      alert('Error: Shift end time must be after shift start time.');
      return;
    }

    const data = {
      machine_id: state.machineId,
      employee_id: state.employeeId,
      shift_start: state.shiftStart,
      lunch_break_start: state.lunchBreakStart,
      lunch_break_end: state.lunchBreakEnd,
      shift_end: shiftEndTime.toISOString(),
      machine_status: state.machineStatus,
    };

    try {
      await axios.post('http://localhost:5000/api/machineOperations/add', data);
      alert('Operation log added successfully!');
      dispatch({ type: 'RESET' });
      setRefresh((prev) => !prev);
    } catch (err) {
      console.error(err);
      alert('Error adding operation log.');
    }
  };

  return (
    <form onSubmit={(e) => e.preventDefault()}>
      <label>
        Employee ID:
        <input type="text" name="employeeId" value={state.employeeId} onChange={handleChange} required />
      </label>
      <label>
        Machine Type:
        <select name="machineId" value={state.machineId} onChange={handleChange} required>
          <option value="" disabled>Select Machine</option>
          <option value="cutting_stitching">Cutting & Stitching</option>
          <option value="sole_molding">Sole Molding (EVA, rubber, PU)</option>
          <option value="lasting">Lasting</option>
          <option value="adhesive_drying">Adhesive & Drying</option>
          <option value="finishing_packaging">Finishing & Packaging</option>
          <option value="shoe_boxes_labels">Shoe Boxes & Labels</option>
        </select>
      </label>
      <div>
        <button type="button" onClick={() => dispatch({ type: 'START_SHIFT' })} disabled={state.isShiftRunning}>
          Start Shift
        </button>
        <button
          type="button"
          onClick={() => dispatch({ type: 'START_LUNCH' })}
          disabled={!state.isShiftRunning || state.isLunchBreak}
        >
          Start Lunch Break
        </button>
        <button type="button" onClick={() => dispatch({ type: 'END_LUNCH' })} disabled={!state.isLunchBreak}>
          End Lunch Break
        </button>
        <button
          type="button"
          onClick={() => {
            const updatedShiftEnd = new Date().toISOString();
            dispatch({ type: 'END_SHIFT' });
            setTimeout(() => handleSubmit(updatedShiftEnd), 100); // Pass updated shiftEnd to validation
          }}
          disabled={!state.isShiftRunning || state.isLunchBreak}
        >
          End Shift & Submit
        </button>
      </div>
    </form>
  );
};

export default MachineOperationForm;
