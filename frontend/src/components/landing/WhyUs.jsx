import AnalyticsView from "../../assets/AnalyticsView.png";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import {
  faChartLine,
  faShieldHalved,
  faChartPie,
} from "@fortawesome/free-solid-svg-icons";

const points = [
  {
    icon: <FontAwesomeIcon icon={faChartLine} />,
    title: "Real-time Tracking",
    desc: "Monitor workforce productivity and attendance trends as they happen.",
  },
  {
    icon: <FontAwesomeIcon icon={faShieldHalved} />,
    title: "Role-based Access",
    desc: "Secure your sensitive data with granular permissions and audit logs.",
  },
  {
    icon: <FontAwesomeIcon icon={faChartPie} />,
    title: "Powerful Analytics",
    desc: "Get automated reports on turnover, diversity, and department costs.",
  },
];

export default function WhyUs() {
  return (
    <section className="why">
      <div className="why-container">
        {/* IMAGE */}
        <div className="why-image">
          <img src={AnalyticsView} alt="" />
        </div>

        {/* CONTENT */}
        <div className="why-content">
          <h2>
            Unlock your team's
            <span> true potential</span>
          </h2>

          <p className="why-desc">
            Move beyond spreadsheets and manual entries. Our platform provides
            the insights you need to make better people decisions.
          </p>

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
