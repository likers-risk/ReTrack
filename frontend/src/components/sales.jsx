import { useEffect, useState } from "react";

export default function Sales() {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const days = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];

  // Fetch products from API
  useEffect(() => {
    const fetchProducts = async () => {
      const authToken = localStorage.getItem("authToken");

      try {
        const response = await fetch("http://127.0.0.1:8000/api/products", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        });

        if (!response.ok) throw new Error("Failed to fetch products");
        const data = await response.json();
        setProducts(data.products);
        setFilteredProducts(data.products);
      } catch (err) {
        setError(err.message);
      }
    };

    fetchProducts();
  }, []);

  // Filter and search products
  useEffect(() => {
    let filtered = [...products];

    if (search) {
      filtered = filtered.filter((p) =>
        p.product_name.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (categoryFilter) {
      filtered = filtered.filter((p) => p.category_id === categoryFilter);
    }

    setFilteredProducts(filtered);
  }, [search, categoryFilter, products]);

  // Sort by expiration date ascending
  const sortedProducts = filteredProducts.sort(
    (a, b) => new Date(a.expiration_date) - new Date(b.expiration_date)
  );

  return (
    <div style={{ backgroundColor: "#F3F2EC" }} className="flex-column p-3">
      <div className="d-flex justify-content-between mb-3 gap-2 flex-wrap">
        <input
          type="text"
          placeholder="Search product..."
          className="form-control"
          style={{ maxWidth: "250px" }}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select
          className="form-select"
          style={{ maxWidth: "200px" }}
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
        >
          <option value="">All Categories</option>
          {[...new Set(products.map((p) => p.category_id))].map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      <div className="d-flex flex-row overflow-auto mb-3 gap-3">
        {days.map((day) => (
          <div key={day} className="bg-white rounded-3 p-3 shadow text-center">
            <h5 className="fw-bold">{day}</h5>
          </div>
        ))}
      </div>

      {error && <p className="text-danger">{error}</p>}

      <div className="table-responsive bg-white rounded shadow-sm p-3">
        <table className="table table-striped table-bordered mb-0">
          <thead className="table-dark">
            <tr>
              <th>Product ID</th>
              <th>Product Name</th>
              <th>Price</th>
              <th>Cost</th>
              <th>Quantity</th>
              <th>Total Value</th>
              <th>Expiration Date</th>
              <th>Category</th>
            </tr>
          </thead>
          <tbody>
            {sortedProducts.map((product) => (
              <tr
                key={product.id}
                className={product.stocks?.quantity < 5 ? "table-warning" : ""}
                title={product.stocks?.quantity < 5 ? "Low Stock!" : ""}
              >
                <td>{product.id}</td>
                <td>{product.product_name}</td>
                <td>₱{product.price}</td>
                <td>₱{product.cost}</td>
                <td>{product.stocks?.quantity}</td>
                <td>
                  ₱
                  {(product.price * (product.stocks?.quantity || 0)).toFixed(2)}
                </td>
                <td>{product.expiration_date}</td>
                <td>{product.category_id}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {sortedProducts.length === 0 && (
          <p className="text-center mt-2">No products found.</p>
        )}
      </div>
    </div>
  );
}
