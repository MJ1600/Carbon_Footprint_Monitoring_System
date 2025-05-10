const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors'); // Import cors
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;


app.use(cors()); // Enable CORS
app.use(express.json());

// Connect to MongoDB Atlas
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log('MongoDB connection error:', err));

mongoose.connection.on('connected', () => {
  console.log('Mongoose connected to DB');
});

mongoose.connection.on('error', (err) => {
  console.log('Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('Mongoose disconnected');
});

// Import the route modules with unique names
const inventoryRoutes = require('./Routes/routes_Inventory');
const machineOperationsRoutes = require('./Routes/routes_machineOperation');
const authRoutes = require('./Routes/routes_auth');
const emissionRoutes = require('./routes/emissions');
const insightRoutes = require('./Routes/routes_insight');

app.use('/api/inventory', inventoryRoutes);
app.use('/api/machineOperations', machineOperationsRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/emissions', emissionRoutes);
app.use('/api/insight', insightRoutes);


app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
