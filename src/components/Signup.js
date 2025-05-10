import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./Signup.css"; // Import the CSS file

const Signup = () => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); // Reset error state

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    const data = { username, email, password };

    try {
      await axios.post("http://localhost:5000/api/auth/signup", data);
      alert("Signup successful!");
      navigate("/login"); // Redirect to Login page after signup
    } catch (err) {
      console.error(err);
      setError("Signup failed! Please try again.");
    }
  };

  return (
    <div className="form-container">
      <form className="form" onSubmit={handleSubmit}>

        {/* Username Field */}
        <div className="input-span">
          <label className="label">Username</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            placeholder="Enter your username"
          />
        </div>

        {/* Email Field */}
        <div className="input-span">
          <label className="label">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="Enter your email"
          />
        </div>

        {/* Password Field */}
        <div className="input-span">
          <label className="label">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="Enter your password"
          />
        </div>

        {/* Error Message Display */}
        {error && <p className="error-text">{error}</p>}

        {/* Submit Button */}
        <button type="submit" className="submit">
          Sign Up
        </button>

        {/* Already have an account? */}
        <p className="span">
          Already have an account? <a href="/login">Login here</a>
        </p>
      </form>
    </div>
  );
};

export default Signup;
