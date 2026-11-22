import { useEffect, useState } from "react";
import { getQueue, onOfflineChange, removeFromQueue, syncNow } from "../offline";
import { peso } from "../api";

/**
 * Shows internet status and anything saved offline, with a manual "Sync now" button.
 * Hidden when online and nothing is waiting.
 */
export default function SyncBar() {
  const [online, setOnline] = useState(navigator.onLine);
  const [queue, setQueue] = useState(getQueue());
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(
    () =>
      onOfflineChange(() => {
        setOnline(navigator.onLine);
        setQueue(getQueue());
      }),
    []
  );

  const handleSync = async () => {
    setSyncing(true);
    setMessage(null);
    const result = await syncNow();
    setSyncing(false);
    setQueue(getQueue());
    if (result.error) {
      setMessage({ type: "danger", text: result.error });
    } else if (result.stoppedOffline) {
      setMessage({
        type: "warning",
        text: `Synced ${result.synced}. Still can't reach the server — try again when the internet is back.`,
      });
    } else if (result.failed) {
      setMessage({
        type: "danger",
        text: `Synced ${result.synced}, but ${result.failed} item(s) were refused. See details.`,
      });
      setShowDetails(true);
    } else {
      setMessage({ type: "success", text: `All done — synced ${result.synced} item(s).` });
      setTimeout(() => window.dispatchEvent(new Event("retrack:synced")), 0);
    }
  };

  if (online && queue.length === 0 && !message) return null;

  return (
    <div
      className={`alert ${online ? "alert-warning" : "alert-secondary"} d-flex flex-column gap-2 mb-3`}
      role="status"
    >
      <div className="d-flex flex-wrap align-items-center gap-2">
        <span className="fw-semibold">
          <i className={`fa-solid ${online ? "fa-wifi" : "fa-plane"} me-2`}></i>
          {online ? "Online" : "Offline mode"}
        </span>
        <span className="small">
          {queue.length === 0
            ? "Nothing waiting to sync."
            : `${queue.length} item(s) saved on this device, waiting to sync.`}
          {!online && " Sales and stock changes are saved here until you sync."}
        </span>
        <div className="ms-auto d-flex gap-2">
          {queue.length > 0 && (
            <button
              className="btn btn-sm btn-outline-dark"
              onClick={() => setShowDetails((v) => !v)}
            >
              {showDetails ? "Hide" : "Details"}
            </button>
          )}
          <button
            className="btn btn-sm btn-dark"
            onClick={handleSync}
            disabled={syncing || queue.length === 0}
          >
            <i className="fa-solid fa-rotate me-1"></i>
            {syncing ? "Syncing…" : "Sync now"}
          </button>
          {message && (
            <button className="btn btn-sm btn-link" onClick={() => setMessage(null)}>
              ✕
            </button>
          )}
        </div>
      </div>

      {message && <div className={`small text-${message.type === "success" ? "success" : "danger"}`}>{message.text}</div>}

      {showDetails && queue.length > 0 && (
        <ul className="list-group small">
          {queue.map((e) => (
            <li key={e.id} className="list-group-item d-flex align-items-center gap-2">
              <span className="badge bg-secondary text-uppercase">{e.kind === "sale" ? "sale" : e.kind}</span>
              <span>
                {e.label}
                {e.kind === "sale" && ` — ${peso(e.total)}`}
              </span>
              <span className="text-muted ms-auto">{new Date(e.created_at).toLocaleString()}</span>
              {e.error && (
                <>
                  <span className="text-danger">{e.error}</span>
                  <button
                    className="btn btn-sm btn-outline-danger"
                    onClick={() => {
                      if (window.confirm("Discard this item? It will not be recorded.")) removeFromQueue(e.id);
                    }}
                  >
                    Discard
                  </button>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
