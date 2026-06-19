import { Link } from 'react-router-dom';

export default function CTASection() {
  return (
    <section className="cta" id="contact">
      <div className="cta-inner">
        <h2>Ready to modernize your HR?</h2>
        <p>
          Join thousands of companies who trust HRM Portal to handle their
          most valuable asset — their people.
        </p>
        <div className="cta-actions">
          <Link to="/login" className="btn-primary btn-lg">Start Free Trial</Link>
          <a href="mailto:contact@hrmportal.com" className="btn-outline-light btn-lg">
            Contact Sales
          </a>
        </div>
      </div>
    </section>
  );
}