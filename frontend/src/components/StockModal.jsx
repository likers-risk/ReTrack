import { useState } from "react";
import { apiFetch, errorMessage } from "../api";
import { isNetworkError, queueStockChange } from "../offline";

/**
 * Stock in / stock out for one product (Admin and Staff).
 * - Restock: add new stock that arrived.
 * - Remove: take out expired, damaged, or miscounted items.
 * Works offline: the change is saved on this device and synced later.
 */
export default function StockModal({ product, onClose, onDone }) {
  const [action, setAction] = useState("restock");
  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState("expired");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const current = product.stocks?.quantity ?? 0;
  const qty = parseInt(quantity, 10) || 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (qty < 1) return setError("Enter a quantity of at least 1.");
    if (action === "remove-stock" && qty > current) {
      return setError(`Only ${current} in stock.`);
    }

    const saveOffline = () => {
      queueStockChange(product, action, qty, reason, note.trim());
      onDone(
        "No internet — stock change saved on this device. Press “Sync now” when you're back online.",
        null
      );
    };

    if (!navigator.onLine) return saveOffline();

    setSaving(true);
    try {
      const body =
        action === "restock"
          ? { quantity: qty, note: note.trim() || undefined }
          : { quantity: qty, reason, note: note.trim() || undefined };
      const { ok, data } = await apiFetch(`/products/${product.id}/${action}`, { method: "POST", body });
      if (ok) onDone(data.message, data.product);
      else setError(errorMessage(data));
    } catch (err) {
      if (isNetworkError(err)) saveOffline();
      else setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }} onClick={onClose}>
      <div className="modal-dialog modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
        <form className="modal-content" onSubmit={handleSubmit}>
          <div className="modal-header">
            <h5 className="modal-title">
              <i className="fa-solid fa-boxes-stacked me-2"></i>
              {product.product_name}
            </h5>
            <button type="button" className="btn-close" onClick={onClose} />
          </div>
          <div className="modal-body">
            <p className="mb-3">
              In stock now: <strong>{current}</strong>
            </p>

            <div className="btn-group w-100 mb-3" role="group">
              <button
                type="button"
                className={`btn ${action === "restock" ? "btn-success" : "btn-outline-success"}`}
                onClick={() => setAction("restock")}
              >
                <i className="fa-solid fa-plus me-1"></i> Restock
              </button>
              <button
                type="button"
                className={`btn ${action === "remove-stock" ? "btn-danger" : "btn-outline-danger"}`}
                onClick={() => setAction("remove-stock")}
              >
                <i className="fa-solid fa-minus me-1"></i> Remove
              </button>
            </div>

            <label className="form-label" htmlFor="stock_qty">
              {action === "restock" ? "How many arrived?" : "How many to remove?"}
            </label>
            <input
              id="stock_qty"
              type="number"
              min="1"
              className="form-control mb-3"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              autoFocus
              required
            />

            {action === "remove-stock" && (
              <>
                <label className="form-label" htmlFor="stock_reason">
                  Reason
                </label>
                <select
                  id="stock_reason"
                  className="form-select mb-3"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                >
                  <option value="expired">Expired</option>
                  <option value="damaged">Damaged</option>
                  <option value="adjusted">Miscount / correction</option>
                </select>
              </>
            )}

            <input
              type="text"
              className="form-control"
              placeholder="Note (optional, e.g. supplier delivery #)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={255}
            />

            {qty > 0 && (
              <p className="small text-muted mt-2 mb-0">
                Stock after: <strong>{action === "restock" ? current + qty : Math.max(0, current - qty)}</strong>
              </p>
            )}
            {error && <div className="alert alert-danger mt-3 mb-0 py-2">{error}</div>}
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              className={`btn ${action === "restock" ? "btn-success" : "btn-danger"}`}
              disabled={saving}
            >
              {saving ? "Saving…" : action === "restock" ? "Add stock" : "Remove stock"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
