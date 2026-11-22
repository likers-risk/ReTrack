import { useCallback, useEffect, useState } from "react";
import { apiFetch, errorMessage } from "../api";

const TYPES = {
  added: { label: "New product", color: "primary" },
  sold: { label: "Sold", color: "success" },
  restocked: { label: "Restocked", color: "info" },
  adjusted: { label: "Adjusted", color: "warning" },
  expired: { label: "Expired", color: "danger" },
  damaged: { label: "Damaged", color: "danger" },
  archived: { label: "Removed", color: "secondary" },
};

/** Admin: every stock change, who did it, and when. */
export default function InventoryLog() {
  const [logs, setLogs] = useState([]);
  const [type, setType] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const params = new URLSearchParams();
    if (type) params.set("type", type);
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    try {
      const { ok, data } = await apiFetch(`/inventory-logs?${params}`);
      if (ok) setLogs(data.logs);
      else setError(errorMessage(data));
    } catch {
      setError("Can't reach the server. The inventory log needs internet.");
    } finally {
      setLoading(false);
    }
  }, [type, from, to]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="container-fluid py-3">
      <h4 className="fw-bold mb-3">
        <i className="fa-solid fa-clipboard-list me-2"></i>Inventory Log
      </h4>

      <div className="d-flex flex-wrap gap-2 mb-3 align-items-end">
        <div>
          <label className="form-label small mb-1" htmlFor="logtype">Type</label>
          <select id="logtype" className="form-select" value={type} onChange={(e) => setType(e.target.value)}>
            <option value="">All changes</option>
            {Object.entries(TYPES).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="form-label small mb-1" htmlFor="logfrom">From</label>
          <input id="logfrom" type="date" className="form-control" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div>
          <label className="form-label small mb-1" htmlFor="logto">To</label>
          <input id="logto" type="date" className="form-control" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
        {(type || from || to) && (
          <button className="btn btn-outline-secondary" onClick={() => { setType(""); setFrom(""); setTo(""); }}>
            Clear
          </button>
        )}
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {loading ? (
        <p>Loading…</p>
      ) : logs.length === 0 ? (
        <p className="text-muted">No stock changes found.</p>
      ) : (
        <div className="table-responsive">
          <table className="table table-sm table-hover align-middle bg-white shadow-sm">
            <thead className="table-light">
              <tr>
                <th>Date &amp; time</th>
                <th>Product</th>
                <th>Change</th>
                <th className="text-end">Qty</th>
                <th className="text-end">Stock after</th>
                <th>By</th>
                <th>Note</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => {
                const t = TYPES[log.type] || { label: log.type, color: "secondary" };
                return (
                  <tr key={log.id}>
                    <td className="text-nowrap">{new Date(log.created_at).toLocaleString()}</td>
                    <td>{log.product_name}</td>
                    <td><span className={`badge bg-${t.color}`}>{t.label}</span></td>
                    <td className={`text-end fw-semibold ${log.quantity_change < 0 ? "text-danger" : "text-success"}`}>
                      {log.quantity_change > 0 ? `+${log.quantity_change}` : log.quantity_change}
                    </td>
                    <td className="text-end">{log.quantity_after ?? "—"}</td>
                    <td>{log.username || "—"}</td>
                    <td className="small text-muted">{log.note}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {logs.length === 500 && <small className="text-muted">Showing the latest 500. Use the filters to see older changes.</small>}
        </div>
      )}
    </div>
  );
}
