const mongoose = require('mongoose');

const EmissionSchema = new mongoose.Schema({
  email: { type: String, required: true },
  vehicleType: { type: String, required: true },
  fuelType: { type: String, required: true },
  distance: { type: Number, required: true },
  travelTime: { type: Number, required: true },
  carbonEmission: { type: Number, required: true },
  date: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Emission', EmissionSchema);