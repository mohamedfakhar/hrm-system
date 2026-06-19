import { Link } from 'react-router-dom';

export default function FeaturesSection() {
  return (
    <section className="features" id="features">
      <div className="section-inner">
        <p className="section-eyebrow">Everything you need</p>
        <h2 className="section-title">to manage people</h2>
        <p className="section-sub">
          A centralized hub for all employee records, documents, and team
          management — designed for high-growth teams.
        </p>

        <div className="features-grid">

          <div className="feature-card feature-card--wide">
            <div className="feature-icon">👥</div>
            <h3>Employee Management</h3>
            <p>Digital employee files, automated onboarding, org charts and hierarchy — all in one place.</p>
            {/* IMAGE PLACEHOLDER: employee list screenshot */}
            {/* <img src="/images/feature-employees.png" alt="employees" className="feature-img" /> */}
            <div className="feature-img-placeholder" />
          </div>

          <div className="feature-card feature-card--highlight">
            <div className="feature-icon feature-icon--white">💰</div>
            <h3>Payroll Automation</h3>
            <p>Stop processing manually. Calculate salaries, deductions, and bonuses — generation in one click.</p>
            <Link to="/login" className="btn-primary btn-sm">Explore Payroll →</Link>
          </div>

          <div className="feature-card">
            <div className="feature-icon">📅</div>
            <h3>Attendance Tracking</h3>
            <p>Real-time check-in/out, late detection, and daily attendance reports built in.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">🌴</div>
            <h3>Leave Management</h3>
            <p>Submit requests, approve workflows, and auto-update balances — seamlessly.</p>
          </div>

        </div>
      </div>
    </section>
  );
}