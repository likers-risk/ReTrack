import { Routes, Route } from "react-router-dom";
import "./../node_modules/bootstrap/dist/css/bootstrap.min.css";
import Login from "./pages/loginform";
import Register from "./pages/registerform";
import Dashboard from "./components/dashboard";
import Home from "./components/home";
import AddItems from "./components/additems";
import Sales from "./components/sales";
import ProductView from "./components/shopping";
import Profile from "./pages/Profile";
import Notification from "./components/notification";
import Reports from "./components/Report";
import ManageOrders from "./pages/ManageOrder";
import EditProfile from "./components/EditProfile";

function App() {
  return (
    <>
      <div>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<Dashboard />}>
            <Route index element={<Home />} />
            <Route path="home" element={<Home />} />
            <Route path="add-item" element={<AddItems />} />
            <Route path="sales" element={<Sales />} />
            <Route path="shopping" element={<ProductView />} />
          </Route>
          <Route path="/profile" element={<Profile />}>
            <Route index element={<Reports />} />
            <Route path="total-sales" element={<Reports />} />
            <Route path="notification" element={<Notification />} />
            <Route path="profile" element={<EditProfile />} />
          </Route>
          <Route path="dashboard/orders" element={<ManageOrders />} />
        </Routes>
      </div>
    </>
  );
}

export default App;
