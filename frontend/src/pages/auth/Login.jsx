import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  //  Form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  //  Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      const res = await api.post("/auth/login", { email, password });

      const { user, accessToken, refreshToken } = res.data;

      //  Save tokens 
      localStorage.setItem("token", accessToken);
      localStorage.setItem("refreshToken", refreshToken);
      localStorage.setItem("user", JSON.stringify(user));

      // Update auth context state
      login(user, accessToken, refreshToken);

      toast.success("Login successful ");

      //  Role-based navigation
      if (user.role === "employee") {
        navigate("/employee/dashboard");
      } else if (user.role === "hr") {
        navigate("/hr/add-employee");
      } else {
        navigate("/");
      }
    } catch (err) {
      const message = err.response?.data?.message || "Login failed";

      setError(message);

      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        {/*  Title */}
        <h2 className="text-2xl font-bold text-center text-blue-600 mb-6">
          HRM System - Login
        </h2>

        {/*  Error Message */}
        {error && (
          <div className="bg-red-100 text-red-600 p-3 rounded mb-4 text-sm">
            {error}
          </div>
        )}

        {/*  Form */}
        <form onSubmit={handleSubmit}>
          {/*  Email Input */}
          <div className="mb-4">
            <label className="block text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border rounded px-3 py-2 focus:outline-none focus:border-blue-500"
              placeholder="Enter your email"
              required
            />
          </div>

          {/* Password Input */}
          <div className="mb-4">
            <label className="block text-gray-700 mb-1">Password</label>

            <div className="flex">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border rounded-l px-3 py-2 focus:outline-none focus:border-blue-500"
                placeholder="Enter your password"
                required
              />

              {/*  Toggle Button */}
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="px-3 border rounded-r bg-gray-200"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          {/*  Remember Me */}
          <div className="mb-4 flex items-center">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={() => setRememberMe(!rememberMe)}
              className="mr-2"
            />
            <label className="text-sm text-gray-600">Remember Me</label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        {/*  Register Link */}
        <p className="text-center text-gray-500 mt-4 text-sm">
          Don't have an account?{" "}
          <Link to="/register" className="text-blue-600 hover:underline">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}
