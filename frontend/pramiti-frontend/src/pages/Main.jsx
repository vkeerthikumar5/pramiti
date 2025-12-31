import React from "react";
import { Login } from "../components/Login";
import { Register } from "../components/Register";
import { useLocation } from "react-router-dom";

export default function Main() {
  const location = useLocation();
  const isRegister = location.pathname === "/register";

  return (
    <section className="flex min-h-screen flex-col md:flex-row">
      
      {/* Left Section (Image with blend effect) */}
      <div
        className="hidden md:flex w-3/4 bg-gray-900 bg-blend-multiply bg-cover bg-center text-white items-center justify-center p-8"
        style={{
          backgroundImage: `url('https://images.pexels.com/photos/3082452/pexels-photo-3082452.jpeg')`,
        }}
      >
        <div className="max-w-md text-center">
          <h1 className="text-4xl font-bold mb-4">Welcome to <span className="text-violet-500">Pramiti</span></h1>
          <p className="text-lg text-white/90">
          AI Powered Clarity in Every Document
          </p>
        </div>
      </div>

      {/* Right Section (Login/Register form) */}
      <div className="w-full flex justify-center items-center">
        {isRegister ? <Register /> : <Login />}
      </div>
    </section>
  );
}
