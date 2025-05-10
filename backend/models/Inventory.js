const mongoose = require('mongoose');

const rawMaterialSchema = new mongoose.Schema({
  material_name: String,
  quantity: Number,
  carbon_emission_per_unit: Number,
  total_carbon_emission: Number,
  date_received: Date
});

const inventorySchema = new mongoose.Schema({
  product: String,
  raw_materials: [rawMaterialSchema]
});

module.exports = mongoose.model('Inventory', inventorySchema);