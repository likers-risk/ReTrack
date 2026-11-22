import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import { API_URL } from "../config";
import BarcodeScanner from "./BarcodeScanner";

const ProductView = () => {
  const { isDarkMode } = useTheme();
  const [products, setProducts] = useState([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [cartItems, setCartItems] = useState([]);
  const [scanCode, setScanCode] = useState("");
  const [scanMessage, setScanMessage] = useState(null);
  const [showScanner, setShowScanner] = useState(false);
  const scanInputRef = useRef(null);

  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const [showLowStockModal, setShowLowStockModal] = useState(false);
  const [lowStockMessages, setLowStockMessages] = useState([]);

  const [isVisible, setIsVisible] = useState(false);

  const navigate = useNavigate();
  const isAdmin = localStorage.getItem("role") === "Admin";

  const totalPrice = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const fetchProducts = async () => {
    try {
      const authToken = localStorage.getItem("authToken");

      const response = await fetch(`${API_URL}/api/products`, {
        method: "GET",
        headers: {
          Accept: "application/json",
          ...(authToken && { Authorization: `Bearer ${authToken}` }),
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Error ${response.status}`);
      }

      const data = await response.json();
      setProducts(data.products || []);
    } catch (err) {
      setError(err.message || "Failed to fetch products");
    } finally {
      setIsLoading(false);
    }
  };

  const searchProducts = async (term) => {
    const authToken = localStorage.getItem("authToken");
    if (!term.trim()) {
      fetchProducts();
      return;
    }

    try {
      setIsSearching(true);
      setError("");
      const response = await fetch(
        `${API_URL}/api/search-product?query=${encodeURIComponent(
          term
        )}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      if (!response.ok) throw new Error("Failed to search products");

      const data = await response.json();
      setProducts(data.products || []);
    } catch (err) {
      setError(err.message);
      setProducts([]);
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleSearchChange = (e) => {
    const term = e.target.value;
    setSearchTerm(term);
    term.trim() ? searchProducts(term) : fetchProducts();
  };

  const handleAddToCart = (product) => {
    setCartItems((prevCart) => {
      const existingProduct = prevCart.find((item) => item.id === product.id);
      if (existingProduct) {
        return prevCart.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        return [...prevCart, { ...product, quantity: 1 }];
      }
    });
  };

  // Look up a scanned barcode and put that product in the cart.
  const addByBarcode = useCallback(async (rawCode) => {
    const code = (rawCode || "").trim();
    if (!code) return;
    setScanMessage(null);
    try {
      const response = await fetch(
        `${API_URL}/api/products/barcode/${encodeURIComponent(code)}`,
        {
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${localStorage.getItem("authToken")}`,
          },
        }
      );
      const data = await response.json();
      if (!response.ok) {
        setScanMessage({ type: "danger", text: `No product with barcode ${code}.` });
        return;
      }
      setCartItems((prevCart) => {
        const existing = prevCart.find((item) => item.id === data.product.id);
        if (existing) {
          return prevCart.map((item) =>
            item.id === data.product.id
              ? { ...item, quantity: item.quantity + 1 }
              : item
          );
        }
        return [...prevCart, { ...data.product, quantity: 1 }];
      });
      setScanMessage({ type: "success", text: `Added ${data.product.product_name} to cart.` });
    } catch {
      setScanMessage({ type: "danger", text: "Could not reach the server. Try again." });
    } finally {
      setScanCode("");
      scanInputRef.current?.focus();
    }
  }, []);

  const handleCameraScan = useCallback(
    (code) => {
      setShowScanner(false);
      addByBarcode(code);
    },
    [addByBarcode]
  );

  const deleteProduct = async (productId) => {
    const authToken = localStorage.getItem("authToken");

    try {
      const response = await fetch(
        `${API_URL}/api/products/${productId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );

      if (!response.ok) throw new Error("Failed to delete product");

      setProducts((currentProducts) =>
        currentProducts.filter((product) => product.id !== productId)
      );
    } catch (err) {
      setError(err.message);
    }
  };

  const buyProductsInCart = async () => {
    const authToken = localStorage.getItem("authToken");

    if (!authToken) {
      setError("Authentication token missing. Please log in.");
      navigate("/");
      return;
    }

    if (cartItems.length === 0) {
      setError("Your cart is empty.");
      return;
    }

    const payload = {
      cart_items: cartItems.map((item) => ({
        product_id: item.id,
        quantity: item.quantity,
      })),
    };

    try {
      const response = await fetch(`${API_URL}/api/purchase`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to purchase products.");
      }

      setIsSuccess(true);
      setError("");
      setCartItems([]);
      fetchProducts();

      if (data.low_stock_notifications?.length) {
        setLowStockMessages(data.low_stock_notifications);
        setShowLowStockModal(true);
      }

      setTimeout(() => setIsSuccess(false), 3000);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleQuantityChange = (productId, value) => {
    const newQuantity = Math.max(1, parseInt(value) || 1);
    setCartItems((prevCart) =>
      prevCart.map((item) =>
        item.id === productId ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  const handleRemoveFromCart = (productId) => {
    setCartItems((prevCart) =>
      prevCart.filter((item) => item.id !== productId)
    );
  };

  const updateProduct = async (product) => {
    const authToken = localStorage.getItem("authToken");

    if (!authToken) {
      setError("Authentication required.");
      navigate("/");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("product_name", product.product_name || "");
      formData.append("barcode", product.barcode || "");
      formData.append("category_name", product.category_name || "");
      formData.append("description", product.description || "");
      formData.append("price", product.price || 0);
      formData.append("cost", product.cost || 0);
      formData.append("stocks[quantity]", product.stocks?.quantity || 0);
      formData.append("expiration_date", product.expiration_date || "");

      if (product.imageFile) {
        formData.append("image", product.imageFile);
      }

      formData.append("_method", "PUT");

      const response = await fetch(
        `${API_URL}/api/products/${product.id}`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${authToken}` },
          body: formData,
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to update product");
      }

      const updatedData = await response.json();

      setProducts((prev) =>
        prev.map((p) =>
          p.id === product.id ? updatedData.product ?? updatedData : p
        )
      );

      setIsSuccess(true);
      setError("");
      setIsLoading(false);
      setIsVisible(true);
      setTimeout(() => setIsSuccess(false), 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsVisible(false);
      setShowUpdateModal(false);
      setTimeout(() => window.location.reload(), 2000);
    }
  };

  const FullScreenLoader = ({ message = "Loading..." }) => (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0,0,0,0.7)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        zIndex: 9999,
        color: "#fff",
        backdropFilter: "blur(5px)",
        transition: "opacity 0.3s ease",
      }}
    >
      <div
        className="spinner-border text-light"
        role="status"
        style={{ width: "4rem", height: "4rem" }}
      >
        <span className="visually-hidden">Loading...</span>
      </div>
      <p className="mt-3 fs-5 fw-semibold">{message}</p>
    </div>
  );

  if (isLoading) return <FullScreenLoader message="Loading products.." />;

  return (
    <div
      className="container-fluid py-4 rounded"
      style={{
        backgroundColor: isDarkMode ? "#1f2937" : "white",
        color: isDarkMode ? "#f9fafb" : "#1f2937",
      }}
    >
      {isVisible && (
        <div
          className="modal fade show"
          style={{ display: "block" }}
          tabIndex="-1"
          role="dialog"
          aria-modal="true"
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header border-0 pb-0 justify-content-center">
                <h5 className="modal-title fs-4 fw-bold text-success">
                  Success!
                </h5>
              </div>
              <div className="modal-body text-center pt-2">
                <p>Item added successfully.</p>
              </div>
            </div>
          </div>
        </div>
      )}
      {isSuccess && (
        <div
          className="modal fade show"
          style={{ display: "block" }}
          tabIndex="-1"
          role="dialog"
          aria-modal="true"
          aria-labelledby="successTitle"
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header border-0 pb-0 justify-content-center">
                <h5
                  className="modal-title fs-4 fw-bold text-success"
                  id="successTitle"
                >
                  Success!
                </h5>
              </div>
              <div className="modal-body text-center pt-2">
                <p id="successDesc">Successfully Purchase.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {showLowStockModal && (
        <div className="modal fade show" style={{ display: "block" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header bg-warning">
                <h5 className="modal-title fw-bold text-dark">
                  ⚠️ Low Stock Notice
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowLowStockModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <ul>
                  {lowStockMessages.map((msg, i) => (
                    <li key={i}>{msg}</li>
                  ))}
                </ul>
              </div>
              <div className="modal-footer">
                <button
                  className="btn btn-secondary"
                  onClick={() => setShowLowStockModal(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      <div className="row">
        <div className="col-md-9">
          <h2
            className="mb-4 text-left"
            style={{ color: isDarkMode ? "#f9fafb" : "#1f2937" }}
          >
            Products
          </h2>
          <div className="mb-3" style={{ maxWidth: "400px" }}>
            <form
              className="input-group"
              onSubmit={(e) => {
                e.preventDefault();
                addByBarcode(scanCode);
              }}
            >
              <span className="input-group-text">
                <i className="fa-solid fa-barcode"></i>
              </span>
              <input
                ref={scanInputRef}
                type="text"
                className="form-control"
                placeholder="Scan barcode to add to cart"
                value={scanCode}
                onChange={(e) => setScanCode(e.target.value)}
                autoFocus
              />
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => setShowScanner(true)}
                title="Scan with camera"
              >
                <i className="fa-solid fa-camera"></i>
              </button>
            </form>
            {scanMessage && (
              <div className={`alert alert-${scanMessage.type} py-1 px-2 mt-2 mb-0 small`}>
                {scanMessage.text}
              </div>
            )}
          </div>
          {showScanner && (
            <BarcodeScanner
              onDetected={handleCameraScan}
              onClose={() => setShowScanner(false)}
            />
          )}
          <div className="mb-5" style={{ maxWidth: "400px" }}>
            <div className="input-group">
              <input
                type="text"
                className="form-control"
                placeholder="Search products..."
                value={searchTerm}
                onChange={handleSearchChange}
                style={{
                  backgroundColor: isDarkMode ? "#4b5563" : "white",
                  color: isDarkMode ? "#f9fafb" : "#1f2937",
                  borderColor: isDarkMode ? "#6b7280" : "#dee2e6",
                  borderRight: "none",
                }}
              />
              <span
                className="input-group-text"
                style={{
                  backgroundColor: isDarkMode ? "#4b5563" : "white",
                  color: isDarkMode ? "#9ca3af" : "#6b7280",
                  borderColor: isDarkMode ? "#6b7280" : "#dee2e6",
                  borderLeft: "none",
                }}
              >
                <i className="fa-solid fa-search"></i>
              </span>
            </div>
          </div>

          {(isLoading || isSearching) && (
            <div className="flex justify-center items-center py-5 text-lg text-blue-500">
              <h4
                className="text-center"
                style={{ color: isDarkMode ? "#f9fafb" : "#1f2937" }}
              >
                Loading....
              </h4>
            </div>
          )}

          {!isLoading && !isSearching && products.length === 0 && !error && (
            <div className="text-center py-5">
              <h4 style={{ color: isDarkMode ? "#9ca3af" : "#6b7280" }}>
                No products found
              </h4>
            </div>
          )}

          <div className="row row-cols-1 row-cols-sm-2 row-cols-md-3 g-4">
            {products.map((p) => (
              <div className="col" key={p.id}>
                <div
                  className="card h-100 shadow-sm border-0 rounded-3 cursor-pointer"
                  onClick={() => handleAddToCart(p)}
                  style={{
                    cursor: "pointer",
                    backgroundColor: isDarkMode ? "#374151" : "white",
                    color: isDarkMode ? "#f9fafb" : "#1f2937",
                    maxHeight: "420px",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  {/* Product Image */}
                  {p.image ? (
                    <img
                      src={`${API_URL}/storage/${p.image}`}
                      className="card-img-top"
                      alt={p.product_name}
                      style={{
                        height: "180px",
                        objectFit: "cover",
                        borderRadius: "12px 12px 0 0",
                      }}
                    />
                  ) : (
                    <div
                      className="d-flex align-items-center justify-content-center"
                      style={{
                        height: "180px",
                        backgroundColor: isDarkMode ? "#4b5563" : "#f3f4f6",
                        color: isDarkMode ? "#9ca3af" : "#6b7280",
                        borderRadius: "12px 12px 0 0",
                      }}
                    >
                      <i
                        className="fa-solid fa-image"
                        style={{ fontSize: "48px" }}
                      ></i>
                    </div>
                  )}

                  {/* Product Details */}
                  <div
                    className="card-body d-flex flex-column p-3"
                    style={{ flex: 1 }}
                  >
                    <h6
                      className="card-title fw-bold mb-2"
                      style={{ fontSize: "15px" }}
                    >
                      {p.product_name}
                    </h6>
                    {p.barcode && (
                      <small
                        className="d-block mb-2"
                        style={{ color: isDarkMode ? "#9ca3af" : "#6b7280" }}
                      >
                        <i className="fa-solid fa-barcode me-1"></i>
                        {p.barcode}
                      </small>
                    )}

                    {p.description && (
                      <p
                        className="small mb-2"
                        style={{
                          color: isDarkMode ? "#d1d5db" : "#6c757d",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          fontSize: "13px",
                        }}
                      >
                        {p.description}
                      </p>
                    )}

                    <div className="mt-auto">
                      <p
                        className="fw-bold mb-1"
                        style={{ fontSize: "18px", color: "#4f46e5" }}
                      >
                        ₱{p.price}
                      </p>

                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <span
                          className="small"
                          style={{
                            color: isDarkMode ? "#9ca3af" : "#6c757d",
                            fontSize: "12px",
                          }}
                        >
                          Stock:{" "}
                          <span className="fw-semibold">
                            {p.stocks?.quantity}
                          </span>
                        </span>
                        <span
                          className="small"
                          style={{
                            color: isDarkMode ? "#9ca3af" : "#6c757d",
                            fontSize: "12px",
                          }}
                        >
                          Exp:{" "}
                          {new Date(p.expiration_date).toLocaleDateString(
                            "en-US",
                            { month: "short", year: "numeric" }
                          )}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  {isAdmin && (
                  <div
                    className="card-footer d-flex gap-2 p-2"
                    style={{
                      backgroundColor: isDarkMode ? "#4b5563" : "#f8f9fa",
                      borderTop: `1px solid ${
                        isDarkMode ? "#6b7280" : "#dee2e6"
                      }`,
                      borderRadius: "0 0 12px 12px",
                    }}
                  >
                    <button
                      className="btn btn-sm btn-outline-primary flex-grow-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedProduct(p);
                        setShowUpdateModal(true);
                      }}
                      style={{ fontSize: "13px", padding: "6px" }}
                    >
                      <i className="fa-solid fa-pen me-1"></i>
                      Update
                    </button>
                    <button
                      className="btn btn-sm btn-outline-danger flex-grow-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteProduct(p.id);
                      }}
                      style={{ fontSize: "13px", padding: "6px" }}
                    >
                      <i className="fa-solid fa-trash me-1"></i>
                      Delete
                    </button>
                  </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="col-md-3">
          <div
            className="card shadow-sm border-0"
            style={{
              borderRadius: "12px",
              backgroundColor: isDarkMode ? "#374151" : "white",
              position: "sticky",
              top: "20px",
            }}
          >
            <div className="card-body p-4">
              {/* Cart Header */}
              <div className="d-flex align-items-center justify-content-between mb-4">
                <h5
                  className="mb-0 fw-bold d-flex align-items-center gap-2"
                  style={{ color: isDarkMode ? "#f9fafb" : "#1f2937" }}
                >
                  <i className="fa-solid fa-cart-shopping"></i>
                  Cart
                </h5>
                <span
                  className="badge rounded-pill"
                  style={{
                    backgroundColor: "#4f46e5",
                    fontSize: "14px",
                    padding: "6px 12px",
                  }}
                >
                  {cartItems.length}
                </span>
              </div>

              {/* Cart Items */}
              {cartItems.length === 0 ? (
                <div className="text-center py-4">
                  <i
                    className="fa-solid fa-cart-shopping mb-3"
                    style={{
                      fontSize: "48px",
                      color: isDarkMode ? "#6b7280" : "#d1d5db",
                    }}
                  ></i>
                  <p
                    className="mb-0"
                    style={{ color: isDarkMode ? "#9ca3af" : "#6b7280" }}
                  >
                    Your cart is empty
                  </p>
                </div>
              ) : (
                <>
                  <div
                    className="cart-items mb-3"
                    style={{ maxHeight: "400px", overflowY: "auto" }}
                  >
                    {cartItems.map((item, index) => (
                      <div
                        key={item.id}
                        className="mb-3 pb-3"
                        style={{
                          borderBottom:
                            index !== cartItems.length - 1
                              ? `1px solid ${
                                  isDarkMode ? "#4b5563" : "#e5e7eb"
                                }`
                              : "none",
                        }}
                      >
                        {/* Item Name and Price */}
                        <div className="d-flex justify-content-between align-items-start mb-2">
                          <h6
                            className="mb-0 fw-semibold"
                            style={{
                              color: isDarkMode ? "#f9fafb" : "#1f2937",
                              fontSize: "14px",
                              flex: 1,
                            }}
                          >
                            {item.product_name}
                          </h6>
                          <span
                            className="fw-bold ms-2"
                            style={{
                              color: isDarkMode ? "#f9fafb" : "#1f2937",
                              fontSize: "14px",
                            }}
                          >
                            ₱{(item.price * item.quantity).toFixed(2)}
                          </span>
                        </div>

                        {/* Quantity Controls */}
                        <div className="d-flex align-items-center justify-content-between">
                          <div className="d-flex align-items-center gap-2">
                            <button
                              className="btn btn-sm d-flex align-items-center justify-content-center"
                              style={{
                                width: "28px",
                                height: "28px",
                                padding: "0",
                                backgroundColor: isDarkMode
                                  ? "#4b5563"
                                  : "#f3f4f6",
                                border: "none",
                                borderRadius: "6px",
                                color: isDarkMode ? "#f9fafb" : "#374151",
                              }}
                              onClick={() =>
                                handleQuantityChange(item.id, item.quantity - 1)
                              }
                              disabled={item.quantity <= 1}
                            >
                              <i
                                className="fa-solid fa-minus"
                                style={{ fontSize: "10px" }}
                              ></i>
                            </button>

                            <span
                              className="fw-semibold"
                              style={{
                                color: isDarkMode ? "#f9fafb" : "#1f2937",
                                minWidth: "30px",
                                textAlign: "center",
                                fontSize: "14px",
                              }}
                            >
                              {item.quantity}
                            </span>

                            <button
                              className="btn btn-sm d-flex align-items-center justify-content-center"
                              style={{
                                width: "28px",
                                height: "28px",
                                padding: "0",
                                backgroundColor: isDarkMode
                                  ? "#4b5563"
                                  : "#f3f4f6",
                                border: "none",
                                borderRadius: "6px",
                                color: isDarkMode ? "#f9fafb" : "#374151",
                              }}
                              onClick={() =>
                                handleQuantityChange(item.id, item.quantity + 1)
                              }
                            >
                              <i
                                className="fa-solid fa-plus"
                                style={{ fontSize: "10px" }}
                              ></i>
                            </button>
                          </div>

                          <button
                            className="btn btn-sm d-flex align-items-center gap-1"
                            style={{
                              backgroundColor: "transparent",
                              border: "none",
                              color: "#dc2626",
                              fontSize: "12px",
                            }}
                            onClick={() => handleRemoveFromCart(item.id)}
                          >
                            <i className="fa-solid fa-trash"></i>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Total and Checkout */}
                  <div
                    className="pt-3 mt-3"
                    style={{
                      borderTop: `2px solid ${
                        isDarkMode ? "#4b5563" : "#e5e7eb"
                      }`,
                    }}
                  >
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <span
                        className="fw-semibold"
                        style={{
                          color: isDarkMode ? "#d1d5db" : "#6b7280",
                          fontSize: "14px",
                        }}
                      >
                        Subtotal
                      </span>
                      <span
                        className="fw-bold"
                        style={{
                          color: isDarkMode ? "#f9fafb" : "#1f2937",
                          fontSize: "18px",
                        }}
                      >
                        ₱{totalPrice.toFixed(2)}
                      </span>
                    </div>

                    <button
                      className="btn btn-primary w-100 fw-semibold d-flex align-items-center justify-content-center gap-2"
                      onClick={buyProductsInCart}
                      style={{
                        backgroundColor: "#4f46e5",
                        border: "none",
                        borderRadius: "8px",
                        padding: "12px",
                        fontSize: "15px",
                      }}
                    >
                      <i className="fa-solid fa-credit-card"></i>
                      Purchase
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {showUpdateModal && selectedProduct && (
        <div
          className="modal fade show"
          style={{ display: "block", background: "rgba(0,0,0,0.5)" }}
          tabIndex="-1"
        >
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Update Product</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowUpdateModal(false)}
                ></button>
              </div>

              <div className="modal-body">
                <input
                  type="text"
                  className="form-control mb-2"
                  placeholder="Product Name"
                  value={selectedProduct.product_name || ""}
                  onChange={(e) =>
                    setSelectedProduct((prev) => ({
                      ...prev,
                      product_name: e.target.value,
                    }))
                  }
                />

                <input
                  type="text"
                  className="form-control mb-2"
                  placeholder="Barcode (optional)"
                  value={selectedProduct.barcode || ""}
                  onChange={(e) =>
                    setSelectedProduct((prev) => ({
                      ...prev,
                      barcode: e.target.value,
                    }))
                  }
                />

                <input
                  type="text"
                  className="form-control mb-2"
                  placeholder="Category"
                  value={selectedProduct.category_name || ""}
                  onChange={(e) =>
                    setSelectedProduct((prev) => ({
                      ...prev,
                      category_name: e.target.value,
                    }))
                  }
                />

                <textarea
                  className="form-control mb-2"
                  placeholder="Description"
                  value={selectedProduct.description || ""}
                  onChange={(e) =>
                    setSelectedProduct((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                />

                <input
                  type="number"
                  className="form-control mb-2"
                  placeholder="Price"
                  value={selectedProduct.price ?? ""}
                  onChange={(e) =>
                    setSelectedProduct((prev) => ({
                      ...prev,
                      price: Number(e.target.value),
                    }))
                  }
                />

                <input
                  type="number"
                  className="form-control mb-2"
                  placeholder="Cost"
                  value={selectedProduct.cost ?? ""}
                  onChange={(e) =>
                    setSelectedProduct((prev) => ({
                      ...prev,
                      cost: Number(e.target.value),
                    }))
                  }
                />

                <input
                  type="number"
                  className="form-control mb-2"
                  placeholder="Quantity"
                  value={selectedProduct.stocks?.quantity ?? 0}
                  onChange={(e) =>
                    setSelectedProduct((prev) => ({
                      ...prev,
                      stocks: {
                        ...prev.stocks,
                        quantity: Number(e.target.value),
                      },
                    }))
                  }
                />

                <input
                  type="date"
                  className="form-control mb-2"
                  value={selectedProduct.expiration_date || ""}
                  onChange={(e) =>
                    setSelectedProduct((prev) => ({
                      ...prev,
                      expiration_date: e.target.value,
                    }))
                  }
                />

                <input
                  type="file"
                  className="form-control mb-2"
                  onChange={(e) =>
                    setSelectedProduct((prev) => ({
                      ...prev,
                      imageFile: e.target.files[0],
                    }))
                  }
                />
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowUpdateModal(false)}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => updateProduct(selectedProduct)}
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductView;
