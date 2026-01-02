// src/components/Login.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';

export function Login() {
  const [email, setEmail] = useState('');
  const [pwd, setPwd] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await api.post("/login/", {
        email,
        password: pwd
      });

      const { role, is_active, access, refresh } = response.data;
      

      // ✅ USER VERIFICATION CHECK
      if (role === "user" && !is_active) {
        alert("⏳ Your account is under verification. Please wait for admin approval.");
        setLoading(false);
        return;
      }

      // ✅ STORE TOKEN & ROLE
      localStorage.setItem("accessToken", access);
      localStorage.setItem("refreshToken", refresh);
      localStorage.setItem("userRole", role);
      localStorage.setItem("isLoggedIn", true);

      // ✅ ROLE BASED REDIRECT
      if (role === "admin") {
        navigate("/admin-dashboard");
      } 
      else if (role === "user") {
        navigate("/user-dashboard");
      } 
      else {
        alert("Unknown role detected!");
      }

    } catch (error) {
      console.error(error);
      alert("❌ Login failed. Invalid credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className='w-full flex m-8 justify-end md:mr-32 items-center min-h-screen'>
      
      <div className="w-full max-w-sm p-4 bg-white border border-gray-200 rounded-lg shadow-sm sm:p-6 md:p-8">
        <form className="max-w-md mx-auto" onSubmit={handleLogin}>
          <h5 className="text-xl font-medium text-gray-900 mb-6"><span className='text-indigo-800'>Pramiti &nbsp;</span>Sign in</h5>

          {/* Email */}
          <div className="relative z-0 w-full mb-5 group">
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="block py-2.5 px-0 w-full text-sm text-gray-900 bg-transparent border-0 
                border-b-2 border-gray-300 appearance-none focus:outline-none 
                focus:ring-0 focus:border-blue-600 peer"
              placeholder=" "
              required
            />
            <label
              htmlFor="email"
              className="peer-focus:font-medium absolute text-sm text-gray-500 duration-300 
                transform -translate-y-6 scale-75 top-3 -z-10 origin-left 
                peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 
                peer-focus:scale-75 peer-focus:-translate-y-6 peer-focus:text-blue-600"
            >
              Email Address
            </label>
          </div>

          {/* Password */}
          <div className="relative z-0 w-full mb-5 group">
            <input
              type="password"
              id="password"
              value={pwd}
              onChange={(e) => setPwd(e.target.value)}
              className="block py-2.5 px-0 w-full text-sm text-gray-900 bg-transparent border-0 
                border-b-2 border-gray-300 appearance-none focus:outline-none 
                focus:ring-0 focus:border-blue-600 peer"
              placeholder=" "
              required
            />
            <label
              htmlFor="password"
              className="peer-focus:font-medium absolute text-sm text-gray-500 duration-300 
                transform -translate-y-6 scale-75 top-3 -z-10 origin-left
                peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 
                peer-focus:scale-75 peer-focus:-translate-y-6 peer-focus:text-blue-600"
            >
              Password
            </label>
          </div>

          {/* Login Button */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full flex items-center justify-center gap-2 text-white 
              bg-violet-900 hover:bg-violet-950 focus:ring-4 focus:outline-none 
              focus:ring-cyan-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center
              ${loading ? 'opacity-75 cursor-not-allowed' : ''}`}
          >
            {loading ? "Logging in..." : "Login to your account"}
          </button>

          <div className="text-sm font-medium text-gray-500 mt-4">
            Not registered?{" "}
            <Link to="/" className="text-violet-900 hover:underline">
              Create account
            </Link>
          </div>

        </form>
      </div>
    </section>
  );
}
