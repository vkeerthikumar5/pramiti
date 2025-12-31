import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";

export default function OrgRegister() {
  const [step, setStep] = useState(1);
  const totalSteps = 3;
  const navigate = useNavigate();

  // Step 1: Login Info
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Step 2: Organization Admin Info
  const [adminName, setAdminName] = useState("");
  const [designation, setDesignation] = useState("");
  const [phone, setPhone] = useState("");

  // Step 3: Organization Info
  const [industry, setIndustry] = useState("");
  const [orgName, setOrgName] = useState("");
  const [orgSize, setOrgSize] = useState("");
  const [registrationId, setRegistrationId] = useState("");

  const [isLoading, setIsLoading] = useState(false);

  const industryList = [
    "IT Services",
    "EdTech",
    "Healthcare",
    "Finance",
    "Legal",
    "Manufacturing",
    "Consulting",
  ];

  const nextStep = () => step < totalSteps && setStep(step + 1);
  const prevStep = () => step > 1 && setStep(step - 1);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    try {
      setIsLoading(true);

      const data = {
        email,
        password,
        admin_name: adminName,
        designation,
        phone_number: phone,
        organization_name: orgName,
        industry,
        organization_size: orgSize,
        registration_id: registrationId,
      };

      await api.post("/register/organization/", data);

      alert("Organization registered successfully!");
      setTimeout(() => navigate("/login"), 1000);
    } catch (err) {
      console.error(err);
      alert("Registration failed.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-violet-900 text-white text-center py-4 shadow-md">
        <h1 className="text-2xl font-bold">Pramiti</h1>
        <p className="text-sm mt-1">AI-Powered Clarity in Every Document</p>
      </header>

      {/* Hero */}
      <section className="bg-center bg-no-repeat bg-[url('https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg')] bg-gray-900 bg-blend-multiply text-center py-10">
        <h2 className="text-3xl md:text-4xl font-extrabold text-white">
          Organization <span className="border-b-4 border-violet-400">Register</span>
        </h2>
      </section>

      {/* Progress */}
      <div className="w-full bg-gray-200 h-2">
        <div
          className="bg-violet-900 h-2 transition-all"
          style={{ width: `${(step / totalSteps) * 100}%` }}
        />
      </div>

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="max-w-5xl mx-auto p-6 bg-white shadow-md rounded-lg mt-6"
      >
        {/* Step 1 */}
        {step === 1 && (
          <>
            <h3 className="text-xl font-semibold mb-4">Login Information</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <input type="email" placeholder="Email" value={email}
                onChange={(e) => setEmail(e.target.value)} className="border p-3 rounded" required/>
              <input type="password" placeholder="Password" value={password}
                onChange={(e) => setPassword(e.target.value)} className="border p-3 rounded" required/>
              <input type="password" placeholder="Confirm Password"
                value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                className="border p-3 rounded" required/>
            </div>
          </>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <>
            <h3 className="text-xl font-semibold mb-4">Admin Details</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <input type="text" placeholder="Admin Full Name"
                value={adminName} onChange={(e) => setAdminName(e.target.value)}
                className="border p-3 rounded" required/>
              <input type="text" placeholder="Designation"
                value={designation} onChange={(e) => setDesignation(e.target.value)}
                className="border p-3 rounded" required/>
              <input type="tel" placeholder="Phone"
                value={phone} onChange={(e) => setPhone(e.target.value)}
                className="border p-3 rounded" required/>
            </div>
          </>
        )}

        {/* Step 3 */}
        {step === 3 && (
          <>
            <h3 className="text-xl font-semibold mb-4">Organization Information</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <select value={industry} onChange={(e) => setIndustry(e.target.value)}
                className="border p-3 rounded">
                <option value="">Select Industry</option>
                {industryList.map((i) => <option key={i}>{i}</option>)}
              </select>

              <input type="text" placeholder="Organization Name"
                value={orgName} onChange={(e) => setOrgName(e.target.value)}
                className="border p-3 rounded" required/>

              <input type="number" placeholder="Organization Size"
                value={orgSize} onChange={(e) => setOrgSize(e.target.value)}
                className="border p-3 rounded" required/>

              <input type="text" placeholder="Registration ID"
                value={registrationId} onChange={(e) => setRegistrationId(e.target.value)}
                className="border p-3 rounded" required/>
            </div>
          </>
        )}

        {/* Buttons */}
        <div className="flex justify-between mt-6">
          {step > 1 ? (
            <button
              type="button"
              onClick={prevStep}
              className="px-5 py-2 rounded bg-gray-200 text-gray-700 hover:bg-gray-300"
            >
              Previous
            </button>
          ) : (
            <div></div>
          )}

          {step < totalSteps ? (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                nextStep();
              }}
              className="px-5 py-2 rounded bg-indigo-600 text-white hover:bg-indigo-700"
            >
              Next
            </button>
          ) : (
            <button
              type="submit"
              disabled={isLoading}
              className="px-5 py-2 rounded bg-indigo-600 text-white hover:bg-indigo-700 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <svg
                    aria-hidden="true"
                    role="status"
                    className="inline w-5 h-5 text-white animate-spin"
                    viewBox="0 0 100 101"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M100 50.59C100 78.205 77.614 100.59 50 100.59S0 78.205 0 50.59 22.386 0.59 50 0.59 100 22.976 100 50.59z"
                      fill="#E5E7EB"
                    />
                    <path
                      d="M93.967 39.04a4 4 0 0 1 3.02-4.832 50 50 0 0 0-5.842-11.31 4 4 0 0 1 6.708-4.39A58 58 0 1 1 81.96 9.837a4 4 0 0 1 4.392 6.709 49.95 49.95 0 0 0 7.615 22.494z"
                      fill="currentColor"
                    />
                  </svg>
                  Submitting...
                </>
              ) : (
                "Submit"
              )}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
