const express = require('express');
const router = express.Router();
const Inventory = require('../models/Inventory');

// GET all inventory items
router.get('/', async (req, res) => {
  try {
    const items = await Inventory.find();
    res.json(items);
  } catch (err) {
    console.error('Error fetching inventory:', err);
    res.status(500).json({ 
      error: 'Failed to fetch inventory', 
      details: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
});

// POST a new inventory item
router.post('/add', async (req, res) => {
  try {
    const { product, raw_materials } = req.body;

    const newItem = new Inventory({
      product,
      raw_materials: raw_materials.map(material => ({
        ...material,
        total_carbon_emission: material.quantity * material.carbon_emission_per_unit
      }))
    });

    await newItem.save();
    res.json({ message: 'Item added successfully!', newItem });
  } catch (err) {
    console.error('Error adding inventory item:', err);
    if (err.name === 'ValidationError') {
      res.status(400).json({ error: 'Invalid input data' });
    } else {
      res.status(500).json({ error: 'Failed to add inventory item' });
    }
  }
});

// PUT update a raw material in an inventory item
router.put('/:productName/raw_materials/:materialName', async (req, res) => {
  const productName = decodeURIComponent(req.params.productName).replace(/&amp;/g, '&');
  const materialName = decodeURIComponent(req.params.materialName);
  const { quantity } = req.body;

  console.log('Updating product:', productName);
  console.log('Updating material:', materialName);
  console.log('New quantity:', quantity);

  try {
    // Log all products in the database
    const allProducts = await Inventory.find({});
    console.log('All products in database:', allProducts.map(p => ({ id: p._id, product: p.product })));

    // Try to find the product using different methods
    let product = await Inventory.findOne({ product: productName });
    
    if (!product) {
      console.log('Product not found with exact match, trying case-insensitive search');
      product = await Inventory.findOne({ product: { $regex: new RegExp(`^${productName}$`, 'i') } });
    }

    if (!product) {
      console.log('Product not found with case-insensitive search, trying partial match');
      product = await Inventory.findOne({ product: { $regex: new RegExp(productName, 'i') } });
    }

    if (!product) {
      console.log('Product not found:', productName);
      return res.status(404).json({ error: "Product not found!" });
    }

    console.log('Product found:', product.product);

    // Use a case-insensitive comparison for material name
    const material = product.raw_materials.find(m => m.material_name.toLowerCase() === materialName.toLowerCase());
    if (!material) {
      console.log('Material not found:', materialName);
      return res.status(404).json({ error: "Material not found!" });
    }

    console.log('Material found:', material.material_name);

    material.quantity = quantity;
    material.total_carbon_emission = quantity * material.carbon_emission_per_unit;

    await product.save();

    res.json({ message: "Material updated successfully!", updatedMaterial: material });
  } catch (error) {
    console.error("Error updating material:", error);
    if (error.name === 'ValidationError') {
      res.status(400).json({ error: 'Invalid input data' });
    } else {
      res.status(500).json({ error: "Failed to update inventory." });
    }
  }
});

module.exports = router;