import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";
import "./Login.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEye,
  faEyeSlash,
  faBuilding,
  faLock,
  faEnvelope,
  faKey,
} from "@fortawesome/free-solid-svg-icons";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await api.post("/auth/login", { email, password });

      const { user, token } = res.data;

      login(user, token);

      toast.success("Welcome back!");

      if (user.role === "employee") {
        navigate("/employee/dashboard");
      } else {
        navigate("/hr/dashboard");
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
    <div className="min-h-screen flex items-center justify-center bg-[#f5f8ff] p-5">
      <div className="w-full max-w-[420px]">
        {/* Logo */}
        <div className="flex justify-center items-center gap-2 mb-5">
          <div className="text-blue-700 text-2xl">
            <FontAwesomeIcon icon={faBuilding} />
          </div>

          <h1 className="text-2xl font-bold text-blue-700">HRM Portal</h1>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="login-header">
            <div className="header-lock">
              <FontAwesomeIcon icon={faLock} />
            </div>

            <p>SECURE LOGIN</p>
          </div>

          {/* Body */}
          <div className="p-6">
            <h2 className="text-2xl font-bold text-center text-gray-800">
              Welcome Back
            </h2>

            <p className="text-center text-sm text-gray-500 mt-2 mb-6">
              Please enter your credentials to continue
            </p>

            {error && <div className="login-error">{error}</div>}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email */}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>

                <div className="input-box">
                  <FontAwesomeIcon icon={faEnvelope} />

                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    required
                  />
                </div>
              </div>

              {/* Password */}

              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">
                    Password
                  </label>

                  <a className="text-xs text-blue-600 cursor-pointer">
                    Forgot password?
                  </a>
                </div>

                <div className="input-box">
                  <FontAwesomeIcon icon={faKey} />

                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-gray-400 hover:text-blue-600"
                  >
                    <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
                  </button>
                </div>
              </div>

              {/* Remember */}

              <div className="flex items-center gap-2 text-sm text-gray-600">
                <input type="checkbox" />

                <span>Remember me for 30 days</span>
              </div>

              <button
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold transition"
              >
                {loading ? "Signing in..." : "Sign In"}
              </button>
            </form>

            {/* Divider */}

            <div className="help-divider">
              <span></span>

              <p>HELP CENTER</p>

              <span></span>
            </div>

            <p className="text-center text-sm text-gray-500">
              Don't have an account?
              <a className="text-blue-600 ml-1 cursor-pointer">
                Contact HR Admin
              </a>
            </p>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          SECURE ENTERPRISE ACCESS
        </p>
      </div>
    </div>
  );
}
