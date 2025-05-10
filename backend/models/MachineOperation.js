const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const MachineOperationSchema = new Schema({
  machine_id: {
    type: String,
    required: true,
  },
  employee_id: {
    type: String,
    required: true,
  },
  shift_start: {
    type: Date,
    required: true,
  },
  lunch_break_start: {
    type: Date,
    required: true,
  },
  lunch_break_end: {
    type: Date,
    required: true,
  },
  shift_end: {
    type: Date,
    required: true,
  },
  machine_status: {
    type: String,
    required: true,
  },
  carbon_emission: {
    type: Number,
    required: true,
  }
});

module.exports = mongoose.model('MachineOperation', MachineOperationSchema);
