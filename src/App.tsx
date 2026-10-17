
import { useEffect, useState } from "react";
import "./App.css";

// Local Flask API for development.
// Later, replace this with your deployed AWS Lambda Function URL.
const API_URL = "http://localhost:5000/api/claims/summary";

const kpis = [
  {
    label: "Total Claims",
    key: "total_claims",
    icon: "#",
    color: "blue",
    format: "number",
  },
  {
    label: "Total Claim Amount",
    key: "total_claim_amount",
    icon: "$",
    color: "purple",
    format: "currency",
  },
  {
    label: "Average Claim Amount",
    key: "average_claim_amount",
    icon: "↗",
    color: "teal",
    format: "currency",
  },
  {
    label: "Male Count",
    key: "male_count",
    icon: "♂",
    color: "orange",
    format: "number",
  },
  {
    label: "Female Count",
    key: "female_count",
    icon: "♀",
    color: "pink",
    format: "number",
  },
];

const lineCharts = [
  "Average Claim Amount by Time of Day",
  "Number of Vehicles Involved",
  "Witnesses",
];

const pieCharts = [
  "Average Claim by Education",
  "Number of Vehicles Involved",
  "Relationship",
  "Insured Sex",
  "Incident Type",
  "Collision Type",
];

const barCharts = [
  "Average Claim by Age",
  "Months as Customer",
  "Average Claim by Bodily Injuries",
  "Policy Deductible",
  "Annual Premium",
];

function SectionHeader({ eyebrow, title, description }) {
  return (
    <div className="section-header">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h2>{title}</h2>
      </div>
      <p className="section-description">{description}</p>
    </div>
  );
}

function ChartCard({ title, type }) {
  return (
    <article className="chart-card">
      <div className="chart-card-header">
        <h3>{title}</h3>
        <button
          className="chart-menu"
          aria-label={`Options for ${title}`}
          type="button"
        >
          ···
        </button>
      </div>

      <div className={`chart-placeholder ${type}-placeholder`}>
        <div className={`chart-icon ${type}-icon`}>
          {type === "line" && (
            <svg viewBox="0 0 48 48" aria-hidden="true">
              <path d="M7 6V40H43" />
              <path d="M11 31L20 21L28 26L40 10" />
              <circle cx="11" cy="31" r="2" />
              <circle cx="20" cy="21" r="2" />
              <circle cx="28" cy="26" r="2" />
              <circle cx="40" cy="10" r="2" />
            </svg>
          )}

          {type === "pie" && (
            <svg viewBox="0 0 48 48" aria-hidden="true">
              <path d="M22 5A19 19 0 1 0 43 26H22Z" />
              <path d="M28 4V20H44A19 19 0 0 0 28 4Z" />
            </svg>
          )}

          {type === "bar" && (
            <svg viewBox="0 0 48 48" aria-hidden="true">
              <path d="M5 42H44" />
              <rect x="10" y="25" width="7" height="17" rx="2" />
              <rect x="22" y="15" width="7" height="27" rx="2" />
              <rect x="34" y="7" width="7" height="35" rx="2" />
            </svg>
          )}
        </div>

        <p>Chart will appear here</p>
        <span>Connect your data to get started</span>
      </div>
    </article>
  );
}

function ChartSection({
  id,
  eyebrow,
  title,
  description,
  charts,
  type,
}) {
  return (
    <section className="dashboard-section" id={id}>
      <SectionHeader
        eyebrow={eyebrow}
        title={title}
        description={description}
      />

      <div className={`chart-grid ${type}-grid`}>
        {charts.map((chart) => (
          <ChartCard key={chart} title={chart} type={type} />
        ))}
      </div>
    </section>
  );
}

function formatKpi(value, format) {
  if (value == null || !Number.isFinite(Number(value))) {
    return "N/A";
  }

  if (format === "currency") {
    return Number(value).toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 2,
    });
  }

  return Number(value).toLocaleString("en-US");
}

function App() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function fetchSummary() {
      try {
        const response = await fetch(API_URL, {
          method: "GET",
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`API request failed: ${response.status}`);
        }

        const data = await response.json();
        setSummary(data);
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error("Failed to fetch claims summary:", err);
          setError(err.message || "Unable to load claims data.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    fetchSummary();

    return () => controller.abort();
  }, []);

  return (
    <main className="dashboard">
      <header className="dashboard-header">
        <div className="brand">
          <div className="brand-icon">C</div>
          <div>
            <p className="brand-overline">ANALYTICS WORKSPACE</p>
            <h1>Claims Dashboard</h1>
          </div>
        </div>

        <div className="header-status">
          <span className="status-dot" />
          Dashboard Overview
          <span className="date-label">All Time</span>
        </div>
      </header>

      {/* KPI CARDS */}
      <section className="dashboard-section">
        <SectionHeader
          eyebrow="AT A GLANCE"
          title="Claims Overview"
          description="A high-level snapshot of your claims portfolio."
        />

        {error && (
          <p role="alert" className="api-error">
            Unable to load claims data: {error}
          </p>
        )}

        <div className="kpi-grid">
          {kpis.map((kpi) => (
            <article className="kpi-card" key={kpi.label}>
              <div className="kpi-top">
                <span className={`kpi-icon ${kpi.color}`}>
                  {kpi.icon}
                </span>
                <span className="kpi-period">All time</span>
              </div>

              <p className="kpi-label">{kpi.label}</p>

              <p className="kpi-value">
                {loading
                  ? "Loading..."
                  : error
                    ? "N/A"
                    : formatKpi(summary?.[kpi.key], kpi.format)}
              </p>

              <div className="kpi-footer">
                <span className="status-dot muted" />
                {loading
                  ? "Fetching data..."
                  : error
                    ? "Connection failed"
                    : "Data loaded"}
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* LINE CHARTS */}
      <ChartSection
        id="line-charts"
        eyebrow="TRENDS & ACTIVITY"
        title="Claims Trends"
        description="Explore trends across time and incident characteristics."
        charts={lineCharts}
        type="line"
      />

      {/* PIE CHARTS */}
      <ChartSection
        id="pie-charts"
        eyebrow="DISTRIBUTION & MIX"
        title="Claims Breakdown"
        description="Explore the distribution of claim characteristics."
        charts={pieCharts}
        type="pie"
      />

      {/* BAR CHARTS */}
      <ChartSection
        id="bar-charts"
        eyebrow="COMPARISONS"
        title="Claims Comparisons"
        description="Compare claim amounts and policyholder metrics."
        charts={barCharts}
        type="bar"
      />

      <footer className="dashboard-footer">
        <span className="footer-logo">C</span>
        Claims Analytics
        <span>·</span>
        Dashboard Template
        <span className="footer-right">
          {loading
            ? "Connecting..."
            : error
              ? "No data connected"
              : "Database connected"}
        </span>
      </footer>
    </main>
  );
}

export default App;
