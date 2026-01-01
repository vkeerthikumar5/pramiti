import { useState, useEffect } from "react";
import api from "../../api";

export default function Profile() {
  const [userData, setUserData] = useState({
    fullName: "",
    dob: "",
    gender: "",
    organization: "",
    department: "",
    employeeId: "",
    designation: "",
    email: "",
    phone_number: "",
    address: "",
    profilePhoto: null, // actual file
    profilePhotoUrl: "", // preview or existing URL
  });
  const [loading, setLoading] = useState(true);

  // Fetch user details on mount
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data } = await api.get("/user/profile/"); // your API endpoint
        setUserData({
          fullName: data.full_name || "",
          dob: data.dob || "",
          gender: data.gender || "",
          organization: data.organization || "",
          department: data.department || "",
          employeeId: data.employee_id || "",
          designation: data.designation || "",
          email: data.email || "",
          phone_number: data.phone_number || "",
          address: data.address || "",
          
        });
        setLoading(false);
        
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  const handleChange = (e) => {
    setUserData({ ...userData, [e.target.name]: e.target.value });
  };

  

  const handleSave = async () => {
    try {
      const formData = new FormData();
  
      // Map frontend keys to backend keys
      const keyMap = {
        fullName: "full_name",
        dob: "dob",
        gender: "gender",
        organization: "organization",
        department: "department",
        employeeId: "employee_id",
        designation: "designation",
        email: "email",
        phone_number: "phone_number",
        address: "address",
        profilePhoto: "profile_photo",
      };
  
     
  
      await api.put("/user/profile/update/", formData, {
        
      });
  
      alert("Profile updated successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to update profile");
    }
  };
  

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
          <p className="text-sm text-indigo-600 font-medium">
            Loading...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <h2 className="text-2xl font-bold text-gray-700 mb-4">My Profile</h2>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Left Column: Avatar */}
        <div className="flex flex-col items-center md:w-1/3">
          
            <div className="w-32 h-32 rounded-full bg-indigo-600 text-white text-4xl flex items-center justify-center mb-4">
              {userData.fullName.charAt(0).toUpperCase()}
            </div>
          
          
        </div>

        {/* Right Column: User Details */}
        <div className="md:w-2/3 grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="text"
            name="fullName"
            value={userData.fullName}
            onChange={handleChange}
            placeholder="Full Name"
            className="border p-3 rounded"
          />
          <input
            type="date"
            name="dob"
            value={userData.dob}
            onChange={handleChange}
            className="border p-3 rounded"
          />
          <select
            name="gender"
            value={userData.gender}
            onChange={handleChange}
            className="border p-3 rounded"
          >
            <option value="">Select Gender</option>
            <option>Male</option>
            <option>Female</option>
            <option>Other</option>
          </select>
          <input
            type="text"
            name="organization"
            value={userData.organization}
            onChange={handleChange}
            placeholder="Organization"
            className="border p-3 rounded bg-gray-200"
          disabled/>
          <input
            type="text"
            name="department"
            value={userData.department}
            onChange={handleChange}
            placeholder="Department"
            className="border p-3 rounded"
          />
          <input
            type="text"
            name="employeeId"
            value={userData.employeeId}
            onChange={handleChange}
            placeholder="Employee ID"
            className="border p-3 rounded"
          />
          <input
            type="text"
            name="designation"
            value={userData.designation}
            onChange={handleChange}
            placeholder="Designation"
            className="border p-3 rounded"
          />
          <input
            type="email"
            name="email"
            value={userData.email}
            onChange={handleChange}
            placeholder="Email"
            className="border p-3 rounded bg-gray-200"
          disabled/>
          <input
            type="tel"
            name="phone_number"
            value={userData.phone_number}
            onChange={handleChange}
            placeholder="Phone Number"
            className="border p-3 rounded"
          />
          <input
            type="text"
            name="address"
            value={userData.address}
            onChange={handleChange}
            placeholder="Address"
            className="border p-3 rounded md:col-span-2"
          />
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          className="px-6 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
        >
          Save Changes
        </button>
      </div>
    </div>
  );
}
