import './StatCard.css';

export default function StatCard({ title, value, icon, color }) {
  return (
    <div className={`stat-card stat-card--${color}`}>
      <div className="stat-card-icon">{icon}</div>
      <div className="stat-card-content">
        <p className="stat-card-title">{title}</p>
        <p className="stat-card-value">{value}</p>
      </div>
    </div>
  );
}