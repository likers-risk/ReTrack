import { Routes, Route } from "react-router-dom";
import { ThemeProvider } from "./context/ThemeContext";
import "./../node_modules/bootstrap/dist/css/bootstrap.min.css";
import Login from "./pages/loginform";
import Register from "./pages/registerform";
import Signup from "./pages/signupform";
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
import PendingUsers from "./components/PendingUsers";
import AdminOnly from "./components/AdminOnly";

function App() {
  return (
    <ThemeProvider>
      <div>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/register" element={<AdminOnly><Register /></AdminOnly>} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/dashboard" element={<Dashboard />}>
            <Route index element={<Home />} />
            <Route path="home" element={<Home />} />
            <Route path="add-item" element={<AdminOnly><AddItems /></AdminOnly>} />
            <Route path="sales" element={<Sales />} />
            <Route path="shopping" element={<ProductView />} />
          </Route>
          <Route path="/profile" element={<Profile />}>
            <Route index element={<Reports />} />
            <Route path="total-sales" element={<Reports />} />
            <Route path="notification" element={<Notification />} />
            <Route path="edit-profile" element={<EditProfile />} />
            <Route path="approvals" element={<AdminOnly><PendingUsers /></AdminOnly>} />
          </Route>
          <Route path="dashboard/orders" element={<ManageOrders />} />
        </Routes>
      </div>
    </ThemeProvider>
  );
}

export default App;
