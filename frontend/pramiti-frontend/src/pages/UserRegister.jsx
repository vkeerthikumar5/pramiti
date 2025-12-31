import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";

export default function UserRegister() {
  const [step, setStep] = useState(1);
  const totalSteps = 3;
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // ✅ ORGANIZATIONS FROM BACKEND
  const [organizations, setOrganizations] = useState([]);

  // ✅ Step 1
  const [fullName, setFullName] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState("");

  // ✅ Step 2
  const [organization, setOrganization] = useState("");
  const [department, setDepartment] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [designation, setDesignation] = useState("");

  // ✅ Step 3
  const [email, setEmail] = useState("");
  const [phone_number, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // ✅ FETCH ORGANIZATIONS FROM BACKEND
  useEffect(() => {
    const fetchOrganizations = async () => {
      try {
        const res = await api.get("/organizations/");
        setOrganizations(res.data);
      } catch (err) {
        console.error("Failed to load organizations", err);
      }
    };
    fetchOrganizations();
  }, []);

  const nextStep = () => step < totalSteps && setStep(step + 1);
  const prevStep = () => step > 1 && setStep(step - 1);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    const data = {
      full_name: fullName,
      dob,
      gender,
      organization,
      department,
      employee_id: employeeId,
      designation,
      email,
      phone_number,
      address,
      password,
    };

    try {
      setIsLoading(true);
      await api.post("/register/user/", data);

      alert("User registered successfully!");
      setTimeout(() => navigate("/login"), 1000);
    } catch (error) {
      console.error(error);
      alert("Registration failed.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ✅ HEADER */}
      <header className="bg-violet-900 text-white text-center py-4 shadow-md">
        <h1 className="text-2xl font-bold">Pramiti</h1>
        <p className="text-sm mt-1">AI-Powered Clarity in Every Document</p>
      </header>

      {/* ✅ HERO */}
      <section className="bg-center bg-no-repeat bg-[url('https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg')] bg-gray-900 bg-blend-multiply text-center py-10">
        <h2 className="text-3xl md:text-4xl font-extrabold text-white">
          User <span className="border-b-4 border-violet-400">Register</span>
        </h2>
      </section>

      {/* ✅ PROGRESS */}
      <div className="w-full bg-gray-200 h-2">
        <div
          className="bg-violet-900 h-2 transition-all duration-300"
          style={{ width: `${(step / totalSteps) * 100}%` }}
        />
      </div>

      {/* ✅ FORM */}
      <form
        onSubmit={handleSubmit}
        className="max-w-5xl mx-auto p-6 bg-white shadow-md rounded-lg mt-6"
      >

        {/* ✅ STEP 1 */}
        {step === 1 && (
          <div className="grid md:grid-cols-2 gap-4">
            <input type="text" placeholder="Full Name" value={fullName}
              onChange={(e) => setFullName(e.target.value)} className="border p-3 rounded" />
            <input type="date" value={dob}
              onChange={(e) => setDob(e.target.value)} className="border p-3 rounded" />
            <select value={gender} onChange={(e) => setGender(e.target.value)}
              className="border p-3 rounded md:col-span-2">
              <option value="">Gender</option>
              <option>Male</option>
              <option>Female</option>
              <option>Other</option>
            </select>
          </div>
        )}

        {/* ✅ STEP 2 */}
        {step === 2 && (
          <div className="grid md:grid-cols-2 gap-4">
            <select value={organization}
              onChange={(e) => setOrganization(e.target.value)}
              className="border p-3 rounded md:col-span-2">
              <option value="">Select Organization</option>
              {organizations.map((org) => (
                <option key={org.id} value={org.organization_name}>
                  {org.organization_name}
                </option>
              ))}
            </select>

            <input type="text" placeholder="Department" value={department}
              onChange={(e) => setDepartment(e.target.value)} className="border p-3 rounded" />
            <input type="text" placeholder="Employee ID" value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)} className="border p-3 rounded" />
            <input type="text" placeholder="Designation" value={designation}
              onChange={(e) => setDesignation(e.target.value)}
              className="border p-3 rounded md:col-span-2" />
          </div>
        )}

        {/* ✅ STEP 3 */}
        {step === 3 && (
          <div className="grid md:grid-cols-2 gap-4">
            <input type="email" placeholder="Email" value={email}
              onChange={(e) => setEmail(e.target.value)} className="border p-3 rounded" />
            <input type="tel" placeholder="Phone" value={phone_number}
              onChange={(e) => setPhone(e.target.value)} className="border p-3 rounded" />
            <input type="text" placeholder="Address" value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="border p-3 rounded md:col-span-2" />
            <input type="password" placeholder="Password" value={password}
              onChange={(e) => setPassword(e.target.value)} className="border p-3 rounded" />
            <input type="password" placeholder="Confirm Password" value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)} className="border p-3 rounded" />
          </div>
        )}

        {/* ✅ BUTTONS */}
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
