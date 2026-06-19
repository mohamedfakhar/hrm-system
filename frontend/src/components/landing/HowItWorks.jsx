export default function HowItWorks() {
  const steps = [
    {
      number: '1',
      title: 'Create Account',
      desc: 'Sign up with your work email and configure your company on the platform.',
      // img: '/images/step-1.png'
    },
    {
      number: '2',
      title: 'Add Employees',
      desc: 'Bulk-add your team and assign roles, departments, and salaries.',
      // img: '/images/step-2.png'
    },
    {
      number: '3',
      title: 'Start Managing',
      desc: 'Automate attendance, approve leaves, and run payroll from one dashboard.',
      // img: '/images/step-3.png'
    },
  ];

  return (
    <section className="how" id="how">
      <div className="section-inner">
        <p className="section-eyebrow">Simple setup in</p>
        <h2 className="section-title">3 easy steps</h2>
        <p className="section-sub">
          Get your entire HR operation running in minutes, not days.
        </p>

        <div className="steps-grid">
          {steps.map((step, index) => (
            <>
              <div className="step-card" key={step.number}>
                <div className="step-number">{step.number}</div>
                <h3>{step.title}</h3>
                <p>{step.desc}</p>
                {/* IMAGE PLACEHOLDER: step screenshot */}
                {/* <img src={step.img} alt={step.title} className="step-img" /> */}
                <div className="step-img-placeholder" />
              </div>
              {/* Connector line between steps */}
              {index < steps.length - 1 && (
                <div className="step-connector" key={`connector-${index}`} />
              )}
            </>
          ))}
        </div>

      </div>
    </section>
  );
}