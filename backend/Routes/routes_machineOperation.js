const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const MachineOperation = require('../models/MachineOperation');

// Emission rates for different machines (kg CO2 per hour)
const emissionRates = {
  'cutting_stitching': 5,
  'sole_molding': 20,
  'lasting': 10,
  'adhesive_drying': 15,
  'finishing_packaging': 5,
  'shoe_boxes_labels': 5
};


const calculateCarbonEmission = (shiftStart, lunchBreakStart, lunchBreakEnd, shiftEnd, machineId) => {
  if (!shiftStart || !shiftEnd || !machineId) return 0;

  const shiftStartTime = new Date(shiftStart);
  const shiftEndTime = new Date(shiftEnd);
  let totalRunningTime = (shiftEndTime - shiftStartTime) / (1000 * 60 * 60); // Convert ms to hours

  if (lunchBreakStart && lunchBreakEnd) {
    const lunchStart = new Date(lunchBreakStart);
    const lunchEnd = new Date(lunchBreakEnd);
    totalRunningTime -= (lunchEnd - lunchStart) / (1000 * 60 * 60); // Subtract lunch break time
  }

  const emissionRate = emissionRates[machineId.toLowerCase()] || 0;
  return totalRunningTime * emissionRate;
};


router.get('/logs', async (req, res) => {
  try {
    const operations = await MachineOperation.find();
    res.json(operations);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch logs', details: err.message });
  }
});


router.get('/:id', async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ error: 'Invalid ObjectId format' });
  }

  try {
    const operation = await MachineOperation.findById(req.params.id);
    if (!operation) return res.status(404).json({ error: 'Log not found' });
    res.json(operation);
  } catch (err) {
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});


router.post('/add', (req, res) => {
  const { machine_id, employee_id, shift_start, lunch_break_start, lunch_break_end, shift_end, machine_status } = req.body;

  if (!machine_id || !employee_id || !shift_start || !shift_end) {
    return res.status(400).json('Error: Missing required fields');
  }

  const shiftStartTime = new Date(shift_start);
  const shiftEndTime = new Date(shift_end);

  // Exclude Sundays
  if (shiftStartTime.getDay() === 0) {
    return res.status(400).json('Error: Cannot log operations for Sundays');
  }

  // Ensure shift end time is after shift start time
  if (shiftEndTime <= shiftStartTime) {
    return res.status(400).json('Error: Shift end time must be after shift start time');
  }

  const carbon_emission = calculateCarbonEmission(shift_start, lunch_break_start, lunch_break_end, shift_end, machine_id);

  const newOperation = new MachineOperation({
    machine_id,
    employee_id,
    shift_start,
    lunch_break_start,
    lunch_break_end,
    shift_end,
    machine_status,
    carbon_emission
  });

  newOperation.save()
    .then(() => res.json('Operation log added!'))
    .catch(err => res.status(400).json('Error: ' + err));
});

// PUT update a specific machine operation log by ID
router.put('/update/:id', (req, res) => {
  const { shift_start, lunch_break_start, lunch_break_end, shift_end, machine_id, employee_id } = req.body;

  if (!shift_start || !shift_end) {
    return res.status(400).json('Error: Missing required fields');
  }

  const shiftStartTime = new Date(shift_start);
  const shiftEndTime = new Date(shift_end);

  // Exclude Sundays
  if (shiftStartTime.getDay() === 0) {
    return res.status(400).json('Error: Cannot update operations for Sundays');
  }

  // Ensure shift end time is after shift start time
  if (shiftEndTime <= shiftStartTime) {
    return res.status(400).json('Error: Shift end time must be after shift start time');
  }

  const carbon_emission = calculateCarbonEmission(shift_start, lunch_break_start, lunch_break_end, shift_end, machine_id);

  MachineOperation.findByIdAndUpdate(req.params.id, { ...req.body, carbon_emission }, { new: true })
    .then(operation => res.json('Operation log updated!'))
    .catch(err => res.status(400).json('Error: ' + err));
});


router.delete('/:id', async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ error: 'Invalid ObjectId format' });
  }

  try {
    const deletedOperation = await MachineOperation.findByIdAndDelete(req.params.id);
    if (!deletedOperation) {
      return res.status(404).json({ error: 'Log not found' });
    }
    res.json({ message: 'Operation log deleted successfully!' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete operation log', details: err.message });
  }
});

module.exports = router;
