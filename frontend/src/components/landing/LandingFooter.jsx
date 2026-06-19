import { Link } from 'react-router-dom';

export default function LandingFooter() {
  return (
    <footer className="landing-footer">
      <div className="footer-inner">

        <div className="footer-brand">
          <span className="nav-logo">HRM Portal</span>
          <p>The most intuitive HR Management System built for modern companies and their teams.</p>
        </div>

        <div className="footer-col">
          <h5>Product</h5>
          <a href="#features">Features</a>
          <a href="#how">How it works</a>
          <Link to="/login">Login</Link>
        </div>

        <div className="footer-col">
          <h5>Company</h5>
          <a href="#about">About</a>
          <a href="#careers">Careers</a>
          <a href="#privacy">Privacy Policy</a>
        </div>

        <div className="footer-col">
          <h5>Support</h5>
          <a href="#help">Help Center</a>
          <a href="#contact">Contact Support</a>
          <a href="#status">System Status</a>
        </div>

      </div>

      <div className="footer-bottom">
        <p>© 2024 HRM Portal. All rights reserved.</p>
        <a href="#">English (US)</a>
      </div>
    </footer>
  );
}