import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import "./Login.css";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const data = { email, password };

    try {
      const response = await axios.post("http://localhost:5000/api/auth/login", data);

      console.log("Login response:", response.data);


      localStorage.setItem("user", JSON.stringify({ email }));
 

      alert("Login successful!");

      navigate("/machineOperations");

    } catch (err) {
      console.error("Login error:", err);

      if (err.response) {
        if (err.response.status === 401) {
          setError("Invalid email or password.");
        } else if (err.response.status === 500) {
          setError("Server error. Please try again later.");
        } else {
          setError("Login failed. Please try again.");
        }
      } else if (err.request) {
        setError("No response from server. Check your internet connection.");
      } else {
        setError("An unexpected error occurred. Please try again.");
      }
    }
  };

  return (
    <form className="form" onSubmit={handleSubmit}>
      {error && <p className="error-message">{error}</p>}

      <span className="input-span">
        <label htmlFor="email" className="label">Email</label>
        <input
          type="email"
          name="email"
          id="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </span>

      <span className="input-span">
        <label htmlFor="password" className="label">Password</label>
        <input
          type="password"
          name="password"
          id="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </span>

      <input className="submit" type="submit" value="Log in" />

      <span className="span">
        Don't have an account? <Link to="/signup">Sign up</Link>
      </span>
    </form>
  );
};

export default Login;
