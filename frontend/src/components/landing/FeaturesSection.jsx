import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUserGroup , faCalendarCheck , faCalendar ,faCircleCheck} from "@fortawesome/free-solid-svg-icons";
import employeeImg from "../../assets/employeeImg.png";
import Icoon from "../../assets/Icoon.png"


export default function FeaturesSection() {
  return (
    <section className="features">
      <div className="section-inner">

        <h2 className="section-title">
          Everything you need to <span>manage people</span>
        </h2>

        <p className="section-sub">
          Simplify your daily HR operations with powerful automation tools designed for high-growth teams.
        </p>

        <div className="features-grid">

          {/* LEFT BIG CARD */}
          <div className="feature-card feature-card--wide">

            <div className="feature-left">
              <div>
                <div className="feature-icoon">
                <FontAwesomeIcon icon={faUserGroup} />
              </div>

              <h3>Employee Management</h3>

              <p>
                A centralized hub for all employee records, documents, and lifecycle management.
                Seamlessly onboard, track, and support your talent.
              </p>

              </div>
              
              <div className="feature-Digital">
                <div className="flex gap-2">
                  <div className="feature-Digital-icon"><FontAwesomeIcon icon={faCircleCheck} /></div>
                  <p>Digital Employee Files</p>
                </div>

                <div className="flex gap-2">
                  <div className="feature-Digital-icon"><FontAwesomeIcon icon={faCircleCheck} /></div>
                  <p>Automated Onboarding</p>
                </div>

                <div className="flex gap-2">
                  <div className="feature-Digital-icon"><FontAwesomeIcon icon={faCircleCheck} /></div>
                  <p>Org Charts & Hierarchy</p>
                </div>

              </div>
              
            </div>

            <div className="feature-right">
              <img src={employeeImg} alt="employee" />
            </div>

          </div>

          {/* RIGHT BIG CARD */}
          <div className="feature-card feature-card--dark">
            <div className="feature-icon white"><img src={Icoon} alt="" /></div>
            <h3>Payroll Automation</h3>
            <p>
              Accurate salary processing, tax compliance, and automated payslip generation in one click.
            </p>

            <Link to="/login" className="btn">
              Explore Payroll →
            </Link>
          </div>

          {/* BOTTOM LEFT */}
          <div className="feature-card">
            <div className="feature-icon"><FontAwesomeIcon icon={faCalendarCheck} /></div>
            <h3>Attendance Tracking</h3>
            <p>Real-time check-in/out, late detection, and reports.</p>
          </div>

          {/* BOTTOM RIGHT */}
          <div className="feature-card">
            <div className="feature-icon"><FontAwesomeIcon icon={faCalendar} /></div>
            <h3>Leave Management</h3>
            <p>Requests, approvals, and balance tracking made easy.</p>
          </div>

        </div>
      </div>
    </section>
  );
}