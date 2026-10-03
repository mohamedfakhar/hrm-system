export default function HowItWorks() {
  const steps = [
    {
      number: "1",
      title: "Create Account",
      desc: "Sign up with your work email and set up your company profile effortlessly.",
    },
    {
      number: "2",
      title: "Add Employees",
      desc: "Bulk upload employee data or send invite links to your team members.",
    },
    {
      number: "3",
      title: "Start Managing",
      desc: "Automate payroll, track attendance, and manage leaves from your dashboard.",
    },
  ];

  return (
    <section className="how" id="how">
      <div className="section-inner">
        <h2 className="section-title">
          Simple setup in <span>3 easy steps</span>
        </h2>

        <p className="section-sub">
          Get your entire team up and running in minutes, not days.
        </p>

        <div className="steps-wrapper">
          {steps.map((step) => (
            <div className="step-item" key={step.number}>
              <div className="step-number">{step.number}</div>

              <div className="step-content">
                <h3>{step.title}</h3>
                <p>{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
