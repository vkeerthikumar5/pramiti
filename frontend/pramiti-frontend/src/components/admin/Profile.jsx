import { useState, useEffect } from "react";
import { FiSave, FiEdit, FiMail, FiUser, FiPhone, FiBriefcase, FiHome, FiHash } from "react-icons/fi";
import api from "../../api";

export default function Profile() {
  const [profile, setProfile] = useState({
    email: "",
    adminName: "",
    designation: "",
    phone: "",
    industry: "",
    orgName: "",
    orgSize: "",
    registrationId: "",
  });

  const [editMode, setEditMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const[loading,setloading]=useState(false)
  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setloading(true)
      const res = await api.get("/org/profile/");
      const data = res.data;

      setProfile({
        email: data.email,
        adminName: data.admin_name,
        designation: data.designation,
        phone: data.phone_number,
        industry: data.industry,
        orgName: data.organization_name,
        orgSize: data.organization_size,
        registrationId: data.registration_id,
      });
      setloading(true)
    } catch (err) {
      console.error("Failed to load profile", err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);

    const payload = {
      admin_name: profile.adminName,
      designation: profile.designation,
      phone_number: profile.phone,
      organization_name: profile.orgName,
      industry: profile.industry,
      organization_size: profile.orgSize,
      registration_id: profile.registrationId,
    };

    try {
      const res = await api.put("/org/profile/", payload);
      alert(res.data.message || "Profile updated successfully!");
      setEditMode(false);
    } catch (err) {
      console.error(err);
      alert("Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  const fieldData = [
    { label: "Email", name: "email", icon: <FiMail />, disabled: true },
    { label: "Admin Name", name: "adminName", icon: <FiUser /> },
    { label: "Designation", name: "designation", icon: <FiBriefcase /> },
    { label: "Phone Number", name: "phone", icon: <FiPhone /> },
    { label: "Organization Name", name: "orgName", icon: <FiHome /> },
    { label: "Industry", name: "industry", icon: <FiBriefcase /> },
    { label: "Organization Size", name: "orgSize", icon: <FiHash /> },
    { label: "Registration ID", name: "registrationId", icon: <FiHash /> },
  ];
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
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-gray-900">Organization Profile</h2>
        <button
          onClick={() => setEditMode(!editMode)}
          className="flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-4 py-2 rounded-lg shadow-lg hover:from-indigo-600 hover:to-purple-600 transition"
        >
          <FiEdit /> {editMode ? "Cancel" : "Edit"}
        </button>
      </div>

      {/* Profile Form */}
      <div className="bg-white shadow-lg rounded-2xl p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        {fieldData.map((f, idx) => (
          <div key={idx} className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-600">{f.icon}</span>
            <input
              type="text"
              name={f.name}
              value={profile[f.name]}
              onChange={handleChange}
              disabled={f.disabled || !editMode}
              placeholder={f.label}
              className={`w-full p-3 pl-10 rounded-lg border text-gray-800 outline-none transition 
                ${f.disabled || !editMode ? "bg-gray-100 cursor-not-allowed border-gray-200" : "border-gray-300 focus:border-indigo-500"} 
                hover:border-indigo-400`}
            />
          </div>
        ))}
      </div>

      {/* Save Button */}
      {editMode && (
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white px-6 py-2 rounded-lg shadow-lg transition"
          >
            <FiSave />
            {isSaving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      )}
    </div>
  );
}
