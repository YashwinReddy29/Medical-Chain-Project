import React, { useState, useEffect } from "react";

const COLORS = ["#00e5c4", "#4fc3f7", "#ffd166", "#ff5370", "#00e676", "#b39ddb"];

function StatCard({ icon, label, value, sub }) {
  return (
    <div className="stat-card">
      <div className="stat-icon">{icon}</div>
      <div className="stat-body">
        <div className="stat-value">{value}</div>
        <div className="stat-label">{label}</div>
        {sub && <div className="stat-sub">{sub}</div>}
      </div>
    </div>
  );
}

function BarChart({ data, title }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="chart-box">
      <h3 className="chart-title">{title}</h3>
      <div className="bar-chart">
        {data.map((d, i) => (
          <div key={i} className="bar-item">
            <div className="bar-label">{d.label}</div>
            <div className="bar-track">
              <div
                className="bar-fill"
                style={{
                  width: `${(d.value / max) * 100}%`,
                  background: COLORS[i % COLORS.length],
                }}
              />
              <span className="bar-value">{d.value}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function DonutChart({ data, title }) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  let cumulative = 0;
  const radius = 60;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className="chart-box">
      <h3 className="chart-title">{title}</h3>
      <div className="donut-wrap">
        <svg width="160" height="160" viewBox="0 0 160 160">
          {data.map((d, i) => {
            const pct = d.value / total;
            const offset = circumference * (1 - cumulative);
            const dash = circumference * pct;
            cumulative += pct;
            return (
              <circle
                key={i}
                cx="80" cy="80" r={radius}
                fill="none"
                stroke={COLORS[i % COLORS.length]}
                strokeWidth="20"
                strokeDasharray={`${dash} ${circumference - dash}`}
                strokeDashoffset={offset}
                style={{ transition: "all 0.5s ease" }}
              />
            );
          })}
          <text x="80" y="85" textAnchor="middle" fill="#e8f4f7" fontSize="22" fontWeight="bold">
            {total}
          </text>
        </svg>
        <div className="donut-legend">
          {data.map((d, i) => (
            <div key={i} className="legend-item">
              <span className="legend-dot" style={{ background: COLORS[i % COLORS.length] }} />
              <span className="legend-label">{d.label}</span>
              <span className="legend-value">{d.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function TimelineChart({ data, title }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  const points = data.map((d, i) => {
    const x = (i / (data.length - 1 || 1)) * 340 + 30;
    const y = 120 - (d.value / max) * 100;
    return `${x},${y}`;
  }).join(" ");

  return (
    <div className="chart-box chart-box-wide">
      <h3 className="chart-title">{title}</h3>
      <svg width="100%" height="150" viewBox="0 0 400 140">
        <polyline
          fill="none"
          stroke="#00e5c4"
          strokeWidth="2.5"
          points={points}
        />
        {data.map((d, i) => {
          const x = (i / (data.length - 1 || 1)) * 340 + 30;
          const y = 120 - (d.value / max) * 100;
          return (
            <g key={i}>
              <circle cx={x} cy={y} r="4" fill="#00e5c4" />
              <text x={x} y="138" textAnchor="middle" fill="#4a7080" fontSize="9">
                {d.label}
              </text>
            </g>
          );
        })}
        <defs>
          <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#00e5c4" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#00e5c4" stopOpacity="0" />
          </linearGradient>
        </defs>
        <polyline
          fill="url(#lineGrad)"
          stroke="none"
          points={`30,120 ${points} 370,120`}
        />
      </svg>
    </div>
  );
}

export default function Analytics({ records, authorizedDoctors, account }) {
  const [stats, setStats] = useState({
    total: 0, active: 0, deleted: 0, doctors: 0,
    byType: [], byMonth: [], byHospital: [],
  });

  useEffect(() => {
    if (!records) return;

    const active = records.filter((r) => r.active);
    const deleted = records.filter((r) => !r.active);

    // By type
    const typeMap = {};
    active.forEach((r) => {
      const t = r.recordType || "other";
      typeMap[t] = (typeMap[t] || 0) + 1;
    });
    const typeLabels = { lab: "Lab", imaging: "Imaging", prescription: "Prescription", report: "Report", vaccine: "Vaccine", other: "Other" };
    const byType = Object.entries(typeMap).map(([k, v]) => ({ label: typeLabels[k] || k, value: v }));

    // By month (last 6 months)
    const monthMap = {};
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = d.toLocaleString("default", { month: "short" });
      monthMap[key] = 0;
    }
    active.forEach((r) => {
      const d = new Date(Number(r.timestamp) * 1000);
      const key = d.toLocaleString("default", { month: "short" });
      if (key in monthMap) monthMap[key]++;
    });
    const byMonth = Object.entries(monthMap).map(([k, v]) => ({ label: k, value: v }));

    // By hospital
    const hospMap = {};
    active.forEach((r) => {
      const h = r.hospital ? `${r.hospital.slice(0, 6)}…${r.hospital.slice(-4)}` : "Unknown";
      hospMap[h] = (hospMap[h] || 0) + 1;
    });
    const byHospital = Object.entries(hospMap).map(([k, v]) => ({ label: k, value: v }));

    setStats({
      total: records.length,
      active: active.length,
      deleted: deleted.length,
      doctors: authorizedDoctors?.length || 0,
      byType, byMonth, byHospital,
    });
  }, [records, authorizedDoctors]);

  return (
    <div className="analytics">
      <div className="stat-grid">
        <StatCard icon="📋" label="Total Records" value={stats.total} />
        <StatCard icon="✅" label="Active Records" value={stats.active} />
        <StatCard icon="🗑️" label="Deleted Records" value={stats.deleted} />
        <StatCard icon="👨‍⚕️" label="Authorized Doctors" value={stats.doctors} />
      </div>

      <div className="charts-grid">
        <TimelineChart data={stats.byMonth} title="📈 Records Over Time (6 months)" />
        <DonutChart data={stats.byType.length ? stats.byType : [{ label: "No data", value: 1 }]} title="🩺 Records by Type" />
        <BarChart data={stats.byHospital.length ? stats.byHospital : [{ label: "No data", value: 0 }]} title="🏥 Records by Hospital" />
      </div>
    </div>
  );
}
