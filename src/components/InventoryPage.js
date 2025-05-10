import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './InventoryPage.css';

const InventoryPage = () => {
  const [inventory, setInventory] = useState([]);
  const [editingItem, setEditingItem] = useState(null);
  const [newQuantity, setNewQuantity] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState('');

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:5000/api/inventory');
      setInventory(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching inventory:', err);
      setError('Failed to load inventory.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const handleUpdate = async (productName, materialName) => {
    const updatedQuantity = parseFloat(newQuantity);
    try {
      setUpdating(true);
      await axios.put(
        `http://localhost:5000/api/inventory/${encodeURIComponent(productName)}/raw_materials/${encodeURIComponent(materialName)}`,
        {
          quantity: updatedQuantity,
        }
      );
      alert('Inventory updated successfully!');
      setEditingItem(null);
      setNewQuantity('');
      fetchInventory();
    } catch (error) {
      console.error('Error updating inventory:', error);
      alert('Failed to update inventory.');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="inventory-container">
      <h2>Inventory Management</h2>

      {loading ? (
        <p>Loading inventory...</p>
      ) : error ? (
        <p className="error">{error}</p>
      ) : (
        <>
          <div className="product-selector">
            <label htmlFor="productDropdown">Select Product:</label>
            <select
              id="productDropdown"
              value={selectedProduct}
              onChange={(e) => setSelectedProduct(e.target.value)}
            >
              <option value="">-- Choose a Product --</option>
              {inventory.map((product) => (
                <option key={product._id} value={product._id}>
                  {product.product}
                </option>
              ))}
            </select>
          </div>

          <div className="inventory-table-container">
            {inventory
              .filter((product) => selectedProduct === product._id)
              .map((product) => {
                const totalEmission = product.raw_materials.reduce(
                  (sum, item) => sum + item.total_carbon_emission,
                  0
                );

                return (
                  <section key={product._id} className="product-section">
                    <h3>{product.product}</h3>
                    <p className="product-total">
                      Total Emission: {totalEmission.toFixed(2)}
                    </p>
                    <table className="inventory-table">
                      <thead>
                        <tr>
                          <th>Material Name</th>
                          <th>Quantity</th>
                          <th>Carbon Emission/Unit</th>
                          <th>Total Carbon Emission</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {product.raw_materials.map((item) => {
                          const uniqueKey = `${product.product}-${item.material_name}`;
                          const isEditing = editingItem === uniqueKey;
                          const quantityValue = isEditing ? newQuantity : item.quantity;
                          const dynamicTotal = isEditing
                            ? parseFloat(newQuantity || 0) * item.carbon_emission_per_unit
                            : item.total_carbon_emission;

                          return (
                            <tr
                              key={uniqueKey}
                              className={isEditing ? 'editing-row' : ''}
                            >
                              <td>{item.material_name}</td>
                              <td>
                                {isEditing ? (
                                  <input
                                    type="number"
                                    value={newQuantity}
                                    onChange={(e) => {
                                      const value = e.target.value;
                                      if (!isNaN(value) && Number(value) >= 0) {
                                        setNewQuantity(value);
                                      }
                                    }}
                                    className="quantity-input"
                                    aria-label="Edit Quantity"
                                  />
                                ) : (
                                  item.quantity
                                )}
                              </td>
                              <td>{item.carbon_emission_per_unit}</td>
                              <td>{dynamicTotal.toFixed(2)}</td>
                              <td>
                                {isEditing ? (
                                  <div className="button-group">
                                    <button
                                      onClick={() => handleUpdate(product.product, item.material_name)}
                                      disabled={
                                        newQuantity === '' ||
                                        parseFloat(newQuantity) === parseFloat(item.quantity) ||
                                        updating
                                      }
                                      className="btn submit"
                                    >
                                      {updating ? 'Updating...' : 'Submit'}
                                    </button>
                                    <button
                                      onClick={() => setEditingItem(null)}
                                      className="btn cancel"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => {
                                      setEditingItem(uniqueKey);
                                      setNewQuantity(item.quantity.toString());
                                    }}
                                    className="btn edit"
                                    aria-label={`Edit ${item.material_name}`}
                                  >
                                    Edit
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </section>
                );
              })}
          </div>
        </>
      )}
    </div>
  );
};

export default InventoryPage;
