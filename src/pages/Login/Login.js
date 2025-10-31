import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import wallpaper from "../../assets/login_wallp.png";
import { MdEmail, MdPassword } from "react-icons/md";
import axios from "axios";

const Login = () => {
  const navigate = useNavigate();
  const [data, setData] = useState({
    email: "",
    password: "",
  });
  const [logging, setLogging] = useState(false);
  const [error, setError] = useState("");

  const login = async () => {
    setLogging(true);
    setError("");

    try {
      const response = await axios.post("/auth/login", data);

      console.log("Login successful:", response.data);
      localStorage.setItem("sessionId", response.data.sessionId);
      localStorage.setItem("data", JSON.stringify(response.data.user));

      // Redirect to home page
      navigate("/");
    } catch (error) {
      console.error("Login error:", error);
      setError("Invalid email or password. Please try again.");
    } finally {
      setLogging(false);
    }
  };

  const handleChange = (e) => {
    setData({
      ...data,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="w-full h-screen flex">
      <div className="flex flex-col px-36 py-6 flex-grow max-w-[60vw]">
        <div className="mt-32 max-w-[600px]">
          <h1 className="text-5xl leading-tight font-semibold mt-4 text-transparent bg-clip-text bg-gradient-to-r to-sky-600 from-sky-400">
            Sakhi
          </h1>
          <h1 className="mt-4 text-2xl font-normal ">
            Empowering your journey to mental well-being with a stigma-free AI companion
          </h1>
        </div>
        <img src={wallpaper} className="w-[450px]" />
      </div>

      <div className="w-0 h-0">
        <div className="fixed top-0 right-0 w-full h-full bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-100 flex items-center justify-center">
          <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl w-full max-w-md p-8 border border-white/20">
            <div className="flex justify-center mb-8">
              <div className="w-20 h-20 bg-gradient-to-r from-sky-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg">
                <span className="text-white text-3xl font-bold">S</span>
              </div>
            </div>

            <h2 className="text-3xl font-bold text-center mb-2 bg-gradient-to-r from-sky-600 to-blue-600 bg-clip-text text-transparent">
              Welcome Back
            </h2>
            <p className="text-center text-gray-600 mb-8">
              Login to access your mental wellness companion
            </p>

            {error && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MdEmail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    name="email"
                    value={data.email}
                    onChange={handleChange}
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition duration-200"
                    placeholder="you@example.com"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MdPassword className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="password"
                    name="password"
                    value={data.password}
                    onChange={handleChange}
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition duration-200"
                    placeholder="Enter your password"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-4 w-4 text-sky-600 focus:ring-sky-500 border-gray-300 rounded"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                    Remember me
                  </label>
                </div>

                <div className="text-sm">
                  <a href="#" className="font-medium text-sky-600 hover:text-sky-500 transition duration-200">
                    Forgot password?
                  </a>
                </div>
              </div>

              <div>
                <button
                  onClick={login}
                  disabled={logging}
                  className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white transition duration-200 ${
                    logging
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500"
                  }`}
                >
                  {logging ? (
                    <div className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Signing in...
                    </div>
                  ) : (
                    "Sign In"
                  )}
                </button>
              </div>

              <div className="mt-6">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">Or</span>
                  </div>
                </div>

                <div className="mt-6 text-center">
                  <span className="text-sm text-gray-600">
                    Don't have an account?{" "}
                    <Link
                      to="/signup"
                      className="font-medium text-sky-600 hover:text-sky-500 transition duration-200"
                    >
                      Sign up
                    </Link>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;