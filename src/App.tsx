
import { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import "./App.css";

const API_URL =
  import.meta.env.VITE_CLAIMS_API_URL ||
  "http://localhost:5000/api/claims/summary";

const money = (value) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Number(value ?? 0));

const number = (value) =>
  new Intl.NumberFormat("en-US").format(Number(value ?? 0));

const incidentHourCharts = [
  {
    title: "Average Claim Payout by Incident Hour",
    subtitle: "Average claim dollars paid at each hour of the day",
    key: "claim_by_hour",
    money: true,
    valueName: "Average claim payout",
    color: "#2563eb",
  },
  {
    title: "Average Vehicles Involved by Incident Hour",
    subtitle: "Average number of vehicles involved at each hour",
    key: "vehicles_by_hour",
    money: false,
    valueName: "Average vehicles",
    color: "#0891b2",
  },
  {
    title: "Average Witnesses by Incident Hour",
    subtitle: "Average number of witnesses at each hour",
    key: "witnesses_by_hour",
    money: false,
    valueName: "Average witnesses",
    color: "#7c3aed",
  },
];

const categoryCharts = [
  {
    title: "Average Claim Payout by Education",
    subtitle: "Average dollars paid per claim for each education level",
    key: "education",
  },
  {
    title: "Average Claim Payout by Number of Vehicles",
    subtitle: "Average dollars paid per claim by vehicle count",
    key: "vehicles",
  },
  {
    title: "Average Claim Payout by Relationship",
    subtitle: "Average dollars paid per claim by insured relationship",
    key: "relationship",
  },
  {
    title: "Average Claim Payout by Sex",
    subtitle: "Average dollars paid per claim by insured sex",
    key: "sex",
  },
  {
    title: "Average Claim Payout by Incident Type",
    subtitle: "Average dollars paid per claim by incident type",
    key: "incident_type",
  },
  {
    title: "Average Claim Payout by Collision Type",
    subtitle: "Average dollars paid per claim by collision type",
    key: "collision_type",
  },
];

const numericCharts = [
  {
    title: "Average Claim Payout by Age",
    subtitle: "Average dollars paid per claim by insured age",
    key: "age",
    xAxisInterval: 4,
  },
  {
    title: "Average Claim Payout by Customer Tenure",
    subtitle: "Average dollars paid per claim by customer tenure",
    key: "customer_tenure",
    xAxisInterval: "preserveStartEnd",
  },
  {
    title: "Average Claim Payout by Bodily Injuries",
    subtitle: "Average dollars paid per claim by injury count",
    key: "bodily_injuries",
    xAxisInterval: "preserveStartEnd",
  },
  {
    title: "Average Claim Payout by Policy Deductible",
    subtitle: "Average dollars paid per claim by deductible amount",
    key: "deductible",
    xAxisInterval: "preserveStartEnd",
  },
  {
    title: "Average Claim Payout by Annual Premium",
    subtitle: "Average dollars paid per claim by premium range",
    key: "annual_premium",
    xAxisInterval: "preserveStartEnd",
  },
];

function ChartCard({
  config,
  data,
  type = "bar",
  height = 320,
}) {
  const chartData = Array.isArray(data) ? data : [];
  const isMoney = config.money !== false;
  const formatValue = isMoney ? money : number;

  const tooltipFormatter = (value) => [
    formatValue(value),
    config.valueName ||
      (isMoney ? "Average claim payout" : "Average"),
  ];

  return (
    <article className="chart-card">
      <h3>{config.title}</h3>
      <p className="chart-subtitle">{config.subtitle}</p>

      {chartData.length === 0 ? (
        <div className="chart-empty">
          No data available.
        </div>
      ) : (
        <div className="real-chart">
          <ResponsiveContainer width="100%" height={height}>
            {type === "line" ? (
              <LineChart
                data={chartData}
                margin={{
                  top: 10,
                  right: 20,
                  left: 10,
                  bottom: 20,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />

                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 12 }}
                  interval="preserveStartEnd"
                  minTickGap={12}
                />

                <YAxis
                  tickFormatter={formatValue}
                  tick={{ fontSize: 11 }}
                  width={85}
                />

                <Tooltip formatter={tooltipFormatter} />
                <Legend />

                <Line
                  type="monotone"
                  dataKey="value"
                  name={config.valueName}
                  stroke={config.color}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            ) : (
              <BarChart
                data={chartData}
                margin={{
                  top: 10,
                  right: 15,
                  left: 10,
                  bottom: 65,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />

                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11 }}
                  angle={-40}
                  textAnchor="end"
                  interval={
                    config.xAxisInterval ?? "preserveStartEnd"
                  }
                  minTickGap={12}
                  height={85}
                  tickMargin={8}
                />

                <YAxis
                  tickFormatter={formatValue}
                  tick={{ fontSize: 11 }}
                  width={85}
                />

                <Tooltip formatter={tooltipFormatter} />

                <Bar
                  dataKey="value"
                  name="Average claim payout"
                  fill="#2563eb"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={55}
                />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      )}
    </article>
  );
}

function KpiCard({ label, value }) {
  return (
    <article className="kpi-card">
      <p className="kpi-label">{label}</p>
      <h2 className="kpi-value">{value}</h2>
    </article>
  );
}

export default function App() {
  const [summary, setSummary] = useState(null);
  const [charts, setCharts] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function loadClaimsData() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(API_URL, {
          method: "GET",
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(
            `API request failed: ${response.status}`
          );
        }

        let data = await response.json();

        if (typeof data.body === "string") {
          data = JSON.parse(data.body);
        }

        if (data.error) {
          throw new Error(data.error);
        }

        setSummary(data.summary || {});
        setCharts(data.charts || {});
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error("Unable to load claims data:", err);
          setError(
            err.message || "Unable to load claims data."
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadClaimsData();

    return () => controller.abort();
  }, []);

  const kpis = [
    {
      label: "Total Claims",
      value: number(summary?.total_claims),
    },
    {
      label: "Total Claim Payout",
      value: money(summary?.total_claim_amount),
    },
    {
      label: "Average Claim Payout",
      value: money(summary?.average_claim_amount),
    },
    {
      label: "Male Insured",
      value: number(summary?.male_count),
    },
    {
      label: "Female Insured",
      value: number(summary?.female_count),
    },
  ];

  return (
    <main className="dashboard">
      <header className="dashboard-header">
        <div>
          <h1>Insurance Claims Dashboard</h1>
          <p>
            Analyze average insurance claim payouts across
            incidents, policyholders, and policy characteristics.
          </p>
        </div>
      </header>

      {error && (
        <div className="api-error" role="alert">
          Unable to load claims data: {error}
        </div>
      )}

      {loading && !summary ? (
        <p className="loading-message">
          Loading claims analytics...
        </p>
      ) : (
        <>
          <section className="kpi-grid">
            {kpis.map((kpi) => (
              <KpiCard
                key={kpi.label}
                label={kpi.label}
                value={kpi.value}
              />
            ))}
          </section>

          <section className="dashboard-section">
            <h2>Incident Hour Analysis</h2>
            <p className="section-description">
              See how claim payouts and incident characteristics
              vary by hour.
            </p>

            <div className="chart-grid line-grid">
              {incidentHourCharts.map((config) => (
                <ChartCard
                  key={config.key}
                  config={config}
                  data={charts[config.key]}
                  type="line"
                  height={320}
                />
              ))}
            </div>
          </section>

          <section className="dashboard-section">
            <h2>Average Claim Payout by Category</h2>
            <p className="section-description">
              Each bar represents the average dollar amount paid
              per claim within that category, not the number of
              claims in the category.
            </p>

            <div className="chart-grid pie-grid">
              {categoryCharts.map((config) => (
                <ChartCard
                  key={config.key}
                  config={config}
                  data={charts[config.key]}
                  height={350}
                />
              ))}
            </div>
          </section>

          <section className="dashboard-section">
            <h2>Average Claim Payout by Numeric Factors</h2>
            <p className="section-description">
              Compare average payouts across age, customer tenure,
              injuries, deductibles, and annual premium ranges.
            </p>

            <div className="chart-grid bar-grid">
              {numericCharts.map((config) => (
                <ChartCard
                  key={config.key}
                  config={config}
                  data={charts[config.key]}
                  height={380}
                />
              ))}
            </div>
          </section>
        </>
      )}
    </main>
  );
}
