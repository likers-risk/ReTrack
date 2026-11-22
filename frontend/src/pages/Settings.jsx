import { useEffect, useState } from "react";
import { apiFetch, errorMessage, peso } from "../api";

/** Admin: pricing formula (SRP) and alert thresholds. */
export default function Settings() {
  const [form, setForm] = useState(null);
  const [message, setMessage] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    apiFetch("/settings")
      .then(({ ok, data }) => {
        if (ok) setForm(data.settings);
        else setMessage({ type: "danger", text: errorMessage(data) });
      })
      .catch(() => setMessage({ type: "danger", text: "Can't reach the server. Settings need internet." }));
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const { ok, data } = await apiFetch("/settings", { method: "PUT", body: form });
      if (ok) {
        setForm(data.settings);
        setMessage({ type: "success", text: data.message });
      } else {
        setMessage({ type: "danger", text: errorMessage(data) });
      }
    } catch {
      setMessage({ type: "danger", text: "Can't reach the server. Try again when online." });
    } finally {
      setSaving(false);
    }
  };

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  return (
    <div className="container py-3" style={{ maxWidth: 640 }}>
      <h4 className="fw-bold mb-3">
        <i className="fa-solid fa-gear me-2"></i>Store Settings
      </h4>
      {message && <div className={`alert alert-${message.type}`}>{message.text}</div>}
      {!form ? (
        !message && <p>Loading…</p>
      ) : (
        <form onSubmit={handleSave} className="card card-body shadow-sm">
          <h6 className="fw-bold">Automated pricing</h6>
          <label className="form-label" htmlFor="markup">
            Markup over cost (%)
          </label>
          <div className="input-group mb-1">
            <input
              id="markup"
              type="number"
              min="0"
              step="0.01"
              className="form-control"
              value={form.markup_percent}
              onChange={set("markup_percent")}
              required
            />
            <span className="input-group-text">%</span>
          </div>
          <small className="text-muted mb-4">
            Suggested Retail Price = cost + {form.markup_percent || 0}%. Example: cost ₱100 →{" "}
            {peso(100 * (1 + (Number(form.markup_percent) || 0) / 100))}. Products set to
            "automatic price" are updated as soon as you save.
          </small>

          <h6 className="fw-bold">Alerts</h6>
          <label className="form-label" htmlFor="lowstock">
            Low-stock alert when quantity is at or below
          </label>
          <input
            id="lowstock"
            type="number"
            min="0"
            className="form-control mb-3"
            value={form.low_stock_threshold}
            onChange={set("low_stock_threshold")}
            required
          />
          <label className="form-label" htmlFor="expiry">
            Expiry alert when a product expires within (days)
          </label>
          <input
            id="expiry"
            type="number"
            min="0"
            className="form-control mb-4"
            value={form.expiry_alert_days}
            onChange={set("expiry_alert_days")}
            required
          />

          <button className="btn btn-primary" disabled={saving}>
            {saving ? "Saving…" : "Save settings"}
          </button>
        </form>
      )}
    </div>
  );
}
