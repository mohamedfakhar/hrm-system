import { Link } from 'react-router-dom';
import Containerr from '../../assets/Containerr.png';

export default function HeroSection() {
  return (
    <section className="hero">
      <div className="hero-inner">

        {/* Left: Text */}
        <div className="hero-text">
          <span className="hero-badge">Trusted by 600+ companies worldwide</span>

          <h1 className="hero-title">
            Smart HR <br />
            <span className="hero-accent">Management</span><br />
            System
          </h1>

          <p className="hero-sub">
            Manage Employees, Attendance, Payroll, and Leaves in one unified
            platform — built for modern workforces with automation at its core.
          </p>

          <div className="hero-actions">
            <Link to="/login" className="btn-primary">Get Started Free</Link>
            <a href="#how" className="btn-outline">Book a Demo</a>
          </div>

          <div className="hero-social-proof">
            <div className="avatars-placeholder">
              <span className="avatar-circle">A</span>
              <span className="avatar-circle">M</span>
              <span className="avatar-circle">S</span>
            </div>
            <p>+41% this quarter</p>
          </div>
        </div>

        {/* Right: Dashboard preview */}
        <div className="hero-visual">
          <img src={Containerr} alt="" />
        </div>
      </div>
    </section>
  );
}