import { apiFetch, errorMessage } from "./api";

/**
 * Offline mode (SRS: record sales, view stock and add stock without internet,
 * then sync manually).
 *
 * - The product list is saved on this device every time it loads online.
 * - Sales and stock changes made offline go into a queue on this device.
 * - "Sync now" sends the queue to the server. Each item has a unique id
 *   (client_ref), so syncing twice never records anything twice.
 */

// Saved per account, so two stores sharing one device never see each other's data.
const accountKey = () => localStorage.getItem("userId") || "guest";
const productsKey = () => `retrack_offline_products_${accountKey()}`;
const queueKey = () => `retrack_offline_queue_${accountKey()}`;
const listeners = new Set();

const read = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};
const write = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error("Could not save offline data:", e);
  }
};

const newId = () =>
  (crypto.randomUUID && crypto.randomUUID()) ||
  `${Date.now()}-${Math.random().toString(16).slice(2)}`;

/** Something on this device changed (queue or cached products). */
const notify = () => listeners.forEach((fn) => fn());
export function onOfflineChange(fn) {
  listeners.add(fn);
  window.addEventListener("online", fn);
  window.addEventListener("offline", fn);
  return () => {
    listeners.delete(fn);
    window.removeEventListener("online", fn);
    window.removeEventListener("offline", fn);
  };
}

// ---------- Products saved on this device ----------
export function saveProducts(products) {
  write(productsKey(), { savedAt: new Date().toISOString(), products });
}
export function getSavedProducts() {
  return read(productsKey(), { savedAt: null, products: [] });
}
/** Change a saved product's stock so the screen stays correct while offline. */
function adjustSavedStock(productId, change) {
  const saved = getSavedProducts();
  saved.products = saved.products.map((p) =>
    p.id === productId
      ? {
          ...p,
          stocks: {
            ...(p.stocks || {}),
            quantity: Math.max(0, (p.stocks?.quantity || 0) + change),
          },
        }
      : p
  );
  write(productsKey(), saved);
}

// ---------- Queue of things to sync ----------
export function getQueue() {
  return read(queueKey(), []);
}
function setQueue(queue) {
  write(queueKey(), queue);
  notify();
}

/** Save a sale made without internet. */
export function queueSale(cartItems, paymentMethod) {
  const items = cartItems.map((i) => ({ product_id: i.id, quantity: i.quantity }));
  const total = cartItems.reduce((s, i) => s + Number(i.price) * i.quantity, 0);
  const entry = {
    id: newId(),
    kind: "sale",
    created_at: new Date().toISOString(),
    label: cartItems.map((i) => `${i.quantity}× ${i.product_name}`).join(", "),
    total,
    body: { cart_items: items, payment_method: paymentMethod },
  };
  items.forEach((i) => adjustSavedStock(i.product_id, -i.quantity));
  setQueue([...getQueue(), entry]);
  return entry;
}

/** Save a restock / remove-stock made without internet. */
export function queueStockChange(product, action, quantity, reason, note) {
  const entry = {
    id: newId(),
    kind: action, // "restock" or "remove-stock"
    created_at: new Date().toISOString(),
    label:
      action === "restock"
        ? `+${quantity} ${product.product_name}`
        : `-${quantity} ${product.product_name} (${reason})`,
    product_id: product.id,
    body:
      action === "restock"
        ? { quantity, note: note || undefined }
        : { quantity, reason, note: note || undefined },
  };
  adjustSavedStock(product.id, action === "restock" ? quantity : -quantity);
  setQueue([...getQueue(), entry]);
  return entry;
}

export function removeFromQueue(id) {
  setQueue(getQueue().filter((e) => e.id !== id));
}

/**
 * Send everything in the queue to the server, oldest first.
 * Returns { synced, failed, stoppedOffline }.
 */
export async function syncNow() {
  let synced = 0;
  let failed = 0;
  for (const entry of getQueue()) {
    try {
      const res =
        entry.kind === "sale"
          ? await apiFetch("/purchase", {
              method: "POST",
              body: { ...entry.body, client_ref: entry.id, sold_at: entry.created_at },
            })
          : await apiFetch(`/products/${entry.product_id}/${entry.kind}`, {
              method: "POST",
              body: { ...entry.body, client_ref: entry.id, done_at: entry.created_at },
            });

      if (res.ok) {
        synced++;
        setQueue(getQueue().filter((e) => e.id !== entry.id));
      } else if (res.status === 401) {
        return { synced, failed, error: "Please log in again, then sync." };
      } else {
        failed++;
        setQueue(
          getQueue().map((e) =>
            e.id === entry.id ? { ...e, error: errorMessage(res.data, "Server refused this item.") } : e
          )
        );
      }
    } catch {
      // Still no connection: stop and keep the rest for later.
      return { synced, failed, stoppedOffline: true };
    }
  }
  return { synced, failed };
}

/** True when an error means "couldn't reach the server". */
export const isNetworkError = (err) => err instanceof TypeError || !navigator.onLine;
