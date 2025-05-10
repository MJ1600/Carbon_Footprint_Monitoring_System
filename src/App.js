import React from 'react';
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Link,
  useNavigate,
  useLocation,
} from 'react-router-dom';
import Home from './components/Home';
import Login from './components/Login';
import Signup from './components/Signup';
import MachineOperationLog from './components/MachineOperationLog';
import MapPage from './components/MapPage';
import PrivateRoute from './components/PrivateRoute';
import InventoryPage from './components/InventoryPage';
import InventoryVisualization from './components/InventoryVisualization';
import './App.css';

const LogoutButton = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <button className="logout-button" onClick={handleLogout}>
      Logout
    </button>
  );
};

const Navbar = () => {
  const location = useLocation();
  const user = localStorage.getItem('user');

  // Hide navbar on login and signup pages
  if (location.pathname === '/login' || location.pathname === '/signup') {
    return null;
  }

  return (
    <nav className="navbar">
      {user && (
        <ul>
          <li><Link to="/map">Map</Link></li>
          <li><Link to="/machineOperations">Machine Operations</Link></li>
          <li><Link to="/inventory">Inventory</Link></li>
          <li><Link to="/inventory-visualization">Visualizations</Link></li>
        </ul>
      )}
      {user && <LogoutButton />}
    </nav>
  );
};

const App = () => {
  return (
    <Router>
      <Navbar />
      <div className="App">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/inventory" element={<PrivateRoute><InventoryPage /></PrivateRoute>} />
          <Route path="/machineOperations" element={<PrivateRoute><MachineOperationLog /></PrivateRoute>} />
          <Route path="/map" element={<PrivateRoute><MapPage /></PrivateRoute>} />
          <Route path="/inventory-visualization" element={<PrivateRoute><InventoryVisualization /></PrivateRoute>} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
