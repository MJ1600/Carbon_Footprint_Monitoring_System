const express = require('express');
const router = express.Router();
const Emission = require('../models/Emission');

// Save emission data
router.post('/save', async (req, res) => {
  try {
    const { email, vehicleType, fuelType, distance, travelTime, carbonEmission } = req.body;

    const newEmission = new Emission({
      email,
      vehicleType,
      fuelType,
      distance,
      travelTime,
      carbonEmission,
    });

    await newEmission.save();
    res.status(201).json({ message: 'Emission data saved successfully' });
  } catch (error) {
    console.error('Error saving emission data:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all emissions
router.get('/all', async (req, res) => {
  try {
    const emissions = await Emission.find();
    res.json(emissions);
  } catch (error) {
    console.error('Error fetching emission data:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;