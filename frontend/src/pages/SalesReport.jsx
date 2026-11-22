import { useCallback, useEffect, useState } from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from "chart.js";
import { apiFetch, errorMessage, peso } from "../api";

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

const today = () => new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD in local time
const daysAgo = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toLocaleDateString("en-CA");
};

const PRESETS = {
  today: { label: "Today", from: () => today(), group: "day" },
  week: { label: "Last 7 days", from: () => daysAgo(6), group: "day" },
  month: { label: "Last 30 days", from: () => daysAgo(29), group: "day" },
  quarter: { label: "Last 3 months", from: () => daysAgo(89), group: "week" },
  year: { label: "Last 12 months", from: () => daysAgo(364), group: "month" },
};

const PAYMENT_LABELS = { cash: "Cash", gcash: "GCash", card: "Card", other: "Other" };

function downloadCsv(filename, rows) {
  const csv = rows
    .map((r) => r.map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function Breakdown({ title, rows, nameKey, nameLabel, showOrders }) {
  return (
    <div className="card shadow-sm mb-3">
      <div className="card-header fw-semibold">{title}</div>
      <div className="table-responsive">
        <table className="table table-sm mb-0 align-middle">
          <thead className="table-light">
            <tr>
              <th>{nameLabel}</th>
              {showOrders && <th className="text-end">Orders</th>}
              <th className="text-end">Items sold</th>
              <th className="text-end">Sales</th>
              <th className="text-end">Cost</th>
              <th className="text-end">Profit</th>
              <th className="text-end">Margin</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan="7" className="text-muted text-center">No sales in this period.</td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r[nameKey]}>
                  <td>{nameKey === "payment_method" ? PAYMENT_LABELS[r[nameKey]] || r[nameKey] : r[nameKey]}</td>
                  {showOrders && <td className="text-end">{r.orders}</td>}
                  <td className="text-end">{r.items}</td>
                  <td className="text-end">{peso(r.sales)}</td>
                  <td className="text-end">{peso(r.cost)}</td>
                  <td className={`text-end fw-semibold ${r.profit < 0 ? "text-danger" : "text-success"}`}>{peso(r.profit)}</td>
                  <td className="text-end">{r.margin}%</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/** Admin: sales and profit by day/week/month, product, category and payment method. */
export default function SalesReport() {
  const [from, setFrom] = useState(daysAgo(6));
  const [to, setTo] = useState(today());
  const [group, setGroup] = useState("day");
  const [report, setReport] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { ok, data } = await apiFetch(`/reports?from=${from}&to=${to}&group=${group}`);
      if (ok) setReport(data);
      else setError(errorMessage(data));
    } catch {
      setError("Can't reach the server. Reports need internet.");
    } finally {
      setLoading(false);
    }
  }, [from, to, group]);

  useEffect(() => {
    load();
  }, [load]);

  const applyPreset = (key) => {
    setFrom(PRESETS[key].from());
    setTo(today());
    setGroup(PRESETS[key].group);
  };

  const exportCsv = () => {
    if (!report) return;
    const rows = [
      [`ReTrack sales report ${report.from} to ${report.to}`],
      [],
      ["Totals", "Orders", "Items", "Sales", "Cost", "Profit", "Margin %"],
      ["All", report.totals.orders, report.totals.items, report.totals.sales, report.totals.cost, report.totals.profit, report.totals.margin],
      [],
      ["Period", "", "Items", "Sales", "Cost", "Profit", "Margin %"],
      ...report.by_period.map((r) => [r.period, "", r.items, r.sales, r.cost, r.profit, r.margin]),
      [],
      ["Product", "", "Items", "Sales", "Cost", "Profit", "Margin %"],
      ...report.by_product.map((r) => [r.product, "", r.items, r.sales, r.cost, r.profit, r.margin]),
      [],
      ["Category", "", "Items", "Sales", "Cost", "Profit", "Margin %"],
      ...report.by_category.map((r) => [r.category, "", r.items, r.sales, r.cost, r.profit, r.margin]),
      [],
      ["Payment method", "Orders", "Items", "Sales", "Cost", "Profit", "Margin %"],
      ...report.by_payment_method.map((r) => [PAYMENT_LABELS[r.payment_method] || r.payment_method, r.orders, r.items, r.sales, r.cost, r.profit, r.margin]),
    ];
    downloadCsv(`retrack-report-${report.from}-to-${report.to}.csv`, rows);
  };

  const t = report?.totals;

  return (
    <div className="container-fluid py-3">
      <div className="d-flex flex-wrap align-items-center gap-2 mb-3">
        <h4 className="fw-bold mb-0 me-auto">
          <i className="fa-solid fa-chart-column me-2"></i>Sales Report
        </h4>
        <button className="btn btn-outline-success" onClick={exportCsv} disabled={!report}>
          <i className="fa-solid fa-file-csv me-1"></i> Export CSV
        </button>
      </div>

      <div className="d-flex flex-wrap gap-2 mb-2">
        {Object.entries(PRESETS).map(([key, p]) => (
          <button key={key} className="btn btn-sm btn-outline-primary" onClick={() => applyPreset(key)}>
            {p.label}
          </button>
        ))}
      </div>
      <div className="d-flex flex-wrap gap-2 mb-3 align-items-end">
        <div>
          <label className="form-label small mb-1" htmlFor="rfrom">From</label>
          <input id="rfrom" type="date" className="form-control" value={from} max={to} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div>
          <label className="form-label small mb-1" htmlFor="rto">To</label>
          <input id="rto" type="date" className="form-control" value={to} min={from} onChange={(e) => setTo(e.target.value)} />
        </div>
        <div>
          <label className="form-label small mb-1" htmlFor="rgroup">Group by</label>
          <select id="rgroup" className="form-select" value={group} onChange={(e) => setGroup(e.target.value)}>
            <option value="day">Day</option>
            <option value="week">Week</option>
            <option value="month">Month</option>
            <option value="year">Year</option>
          </select>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {loading && !report && <p>Loading…</p>}

      {report && t && (
        <>
          <div className="row g-3 mb-3">
            {[
              ["Sales", peso(t.sales), "primary"],
              ["Profit", peso(t.profit), "success"],
              ["Margin", `${t.margin}%`, "info"],
              ["Orders", t.orders, "secondary"],
              ["Items sold", t.items, "dark"],
            ].map(([label, value, color]) => (
              <div className="col-6 col-md" key={label}>
                <div className={`card text-white bg-${color} h-100`}>
                  <div className="card-body py-2">
                    <div className="small">{label}</div>
                    <div className="fs-5 fw-bold">{value}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="card shadow-sm mb-3">
            <div className="card-body" style={{ height: 300 }}>
              {report.by_period.length === 0 ? (
                <p className="text-muted text-center mt-5">No sales in this period.</p>
              ) : (
                <Bar
                  options={{ maintainAspectRatio: false, plugins: { legend: { position: "bottom" } } }}
                  data={{
                    labels: report.by_period.map((r) => r.period),
                    datasets: [
                      { label: "Sales (₱)", data: report.by_period.map((r) => r.sales), backgroundColor: "#0d6efd" },
                      { label: "Profit (₱)", data: report.by_period.map((r) => r.profit), backgroundColor: "#198754" },
                    ],
                  }}
                />
              )}
            </div>
          </div>

          <Breakdown title={`By ${group}`} rows={report.by_period} nameKey="period" nameLabel={group[0].toUpperCase() + group.slice(1)} />
          <Breakdown title="By product" rows={report.by_product} nameKey="product" nameLabel="Product" />
          <Breakdown title="By category" rows={report.by_category} nameKey="category" nameLabel="Category" />
          <Breakdown title="By payment method" rows={report.by_payment_method} nameKey="payment_method" nameLabel="Payment" showOrders />
        </>
      )}
    </div>
  );
}
