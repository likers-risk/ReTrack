import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const ProductView = () => {
  const [products, setProducts] = useState([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [cartItems, setCartItems] = useState([]); 

  const navigate = useNavigate();

  const fetchProducts = async () => {
    const authToken = localStorage.getItem("authToken");

    if (!authToken) {
      console.error("Invalid Unauthorized, please log in");
      navigate("/");
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch("http://127.0.0.1:8000/api/products", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });
      if (!response.ok) {
        throw new Error("Failed to fetch products");
      }
      const data = await response.json();
      setProducts(data.products);
    } catch (err) {
      setError(err.message);
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
        `http://127.0.0.1:8000/api/search-product?query=${encodeURIComponent(
          term
        )}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to search products");
      }

      const data = await response.json();
      setProducts(data.products);
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
    if (term.trim() === "") {
      fetchProducts();
    } else {
      searchProducts(term);
    }
  };

  const handleAddToCart = (product) => {
    setCartItems((prevCart) => {
      const existingProduct = prevCart.find((item) => item.id === product.id);
      if (existingProduct) {
        return prevCart.map((item) =>
          item.id === product.id
            ? { ...item, quantity: (item.quantity || 1) + 1 }
            : item
        );
      } else {
        return [...prevCart, { ...product, quantity: 1 }];
      }
    });
  };

  const deleteProduct = async (productId) => {
    const authToken = localStorage.getItem("authToken");

    try {
      const response = await fetch(
        `http://127.0.0.1:8000/api/products/${productId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete product");
      }

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
      setError("Authentication token missing. Please log in to purchase.");
      navigate("/");
      return;
    }

    
    if (cartItems.length === 0) {
      setError("Your cart is empty. Please add items before purchasing.");
      return;
    }

    const payload = {
      cart_items: cartItems.map(item => ({
        product_id: item.id,
        quantity: item.quantity
      }))
    };

    try {
      const response = await fetch("http://127.0.0.1:8000/api/purchase", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to purchase products.");
      }

      setIsSuccess(true);
      setError("");
      setCartItems([]); 
    
      setTimeout(() => {
        setIsSuccess(false);
         window.location.reload()
      }, 3000);


    } catch (err) {
      setError(err.message);
    }
  };

  const handleQuantityChange = (productId, value) => {
    const newQuantity = Math.max(0, parseInt(value) || 0);
    setCartItems(prevCart => prevCart.map(item =>
      item.id === productId ? { ...item, quantity: newQuantity } : item
    ));
  };
  
  const handleRemoveFromCart = (productId) => {
    setCartItems(prevCart => prevCart.filter(item => item.id !== productId));
  };

  return (
    <div className="container-fluid py-4 bg-white">
      <div className="row">
        <div className="col-md-9">
          <h2 className="mb-4 text-center">Products</h2>
          <div className="mb-5" style={{ width: "400px" }}>
            <input
              type="text"
              className="form-control"
              placeholder="Search products..."
              value={searchTerm}
              onChange={handleSearchChange}
            />
          </div>

          {error && <div className="alert alert-danger">{error}</div>}

          {(isLoading || isSearching) && (
            <div className="flex justify-center items-center py-5 text-lg text-blue-500">
              <h4 className="text-center">Loading....</h4>
            </div>
          )}

          {!isLoading && !isSearching && products.length === 0 && !error && (
            <div className="text-center py-5">
              <h4>No products found</h4>
            </div>
          )}

          <div
            className="row row-cols-1 row-cols-sm-2 row-cols-md-3 g-4"
            style={{ backgroundColor: "#EEEEEE" }}
          >
            {products.map((p) => (
              <div className="col" key={p.id}>
                <div
                  className="card h-100 shadow-sm border-0 rounded-3 cursor-pointer"
                  onClick={() => handleAddToCart(p)} 
                  style={{ cursor: "pointer" }}
                >
                  {p.image ? (
                    <img
                      src={`http://127.0.0.1:8000/storage/${p.image}`}
                      className="card-img-top"
                      alt={p.product_name}
                      style={{
                        height: "160px",
                        objectFit: "contain",
                      }}
                    />
                  ) : (
                    <div
                      className="d-flex align-items-center justify-content-center bg-light"
                      style={{ height: "160px" }}
                    >
                      No image
                    </div>
                  )}

                  <div className="card-body text-center">
                    <h6 className="card-title fw-bold">{p.product_name}</h6>
                    <p className="text-muted small mb-1">{p.description}</p>
                    <p className="fw-semibold">₱{p.price}</p>
                    <p className="text-muted small">
                      Stock: {p.stocks?.quantity}
                    </p>
                    <p className="text-muted small mb-1">
                      Expiration Date: {p.expiration_date}
                    </p>
                  </div>

                  <div className="card-footer d-flex justify-content-between align-items-center bg-white">
                    <button className="btn btn-sm btn-outline-primary">
                      Update
                    </button>
                    <button
                      className="btn btn-sm btn-outline-danger"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteProduct(p.id);
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="col-md-3 border-start">
          <h4>🛒 Cart ({cartItems.length})</h4>
          {isSuccess && <div className="alert alert-success mt-3">Purchase successful!</div>}
          {cartItems.length === 0 ? (
            <p className="text-muted">Your cart is empty.</p>
          ) : (
            <ul className="list-group mb-3">
              {cartItems.map((item) => (
                <li key={item.id} className="list-group-item">
                  <div className="d-flex justify-content-between">
                    <span>{item.product_name}</span>
                    <span>₱{item.price * item.quantity}</span>
                  </div>
                  <div className="d-flex align-items-center mt-2">
                    <span className="me-2">Quantity:</span>
                    <input
                      type="number"
                      min="1"
                      className="form-control form-control-sm me-2"
                      style={{ width: "60px" }}
                      value={item.quantity}
                      onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                    />
                    <button
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => handleRemoveFromCart(item.id)}
                    >
                      Remove
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
          {cartItems.length > 0 && (
            <button
              className="btn btn-primary w-100"
              onClick={buyProductsInCart}
            >
              Buy Now
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductView;