const points = [
  {
    icon: '⚡',
    title: 'Real-Time Tracking',
    desc: 'Monitor attendance, leaves, and salary status as they happen.',
  },
  {
    icon: '🔒',
    title: 'Role-Based Access',
    desc: 'Employees see their own data. HR manages everything. Secure by design.',
  },
  {
    icon: '📊',
    title: 'Powerful Analytics',
    desc: 'Auto-generated reports on attendance, deductions, and department costs.',
  },
];

export default function WhyUs() {
  return (
    <section className="why">
      <div className="section-inner">
        <p className="section-eyebrow">Unlock your team's</p>
        <h2 className="section-title">true potential</h2>
        <p className="section-sub">
          More than spreadsheets and manual records. Get insights that drive smarter decisions.
        </p>

        <div className="why-grid">

          {/* Left: Chart visual */}
          <div className="why-visual">
            {/* IMAGE PLACEHOLDER: analytics chart */}
            {/* <img src="/images/analytics.png" alt="analytics" className="why-img" /> */}
            <div className="why-img-placeholder">
              <div className="chart-bar" style={{ height: '60%' }} />
              <div className="chart-bar" style={{ height: '85%' }} />
              <div className="chart-bar chart-bar--accent" style={{ height: '100%' }} />
              <div className="chart-bar" style={{ height: '70%' }} />
              <div className="chart-bar" style={{ height: '90%' }} />
            </div>
          </div>

          {/* Right: Points */}
          <div className="why-points">
            {points.map((point) => (
              <div className="why-point" key={point.title}>
                <div className="why-icon">{point.icon}</div>
                <div>
                  <h4>{point.title}</h4>
                  <p>{point.desc}</p>
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>
    </section>
  );
}