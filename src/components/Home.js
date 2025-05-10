import React from "react";
import { useNavigate } from "react-router-dom";
import "./Home.css"; // Import CSS file

export default function HomePage() {
  const navigate = useNavigate();

  return (
    <main className="home-page">
      {/* Dark overlay for contrast */}
      <div className="overlay"></div>

      {/* Main content container */}
      <div className="container">
        <h1 className="welcome-text">Welcome to</h1>
        <h2 className="carbon-text">Carbon <span>Tracker Pro</span></h2>

        <p className="subtext">Track your carbon footprint & make a difference!</p>

        {/* Navigate to Login page */}
        <button className="get-started" onClick={() => navigate("/login")}>
          GET STARTED
        </button>
      </div>
    </main>
  );
}
