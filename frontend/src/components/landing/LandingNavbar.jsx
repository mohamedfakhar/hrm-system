import { Link } from 'react-router-dom';

export default function LandingNavbar() {
  return (
    <nav className="landing-nav">
      <div className="nav-inner">
        <span className="nav-logo">HRM Portal</span>
        <div className="nav-links">
          <a href="#features">Features</a>
          <a href="#how">How it works</a>
          <a href="#contact">Contact</a>
        </div>
        <Link to="/login" className="nav-btn">Sign In</Link>
      </div>
    </nav>
  );
}