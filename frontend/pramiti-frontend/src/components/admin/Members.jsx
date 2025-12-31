// src/pages/members/Members.jsx
import React, { useMemo, useState, useEffect } from "react";
import { FiSearch, FiUsers, FiUserCheck, FiUserX, FiUserPlus } from "react-icons/fi";
import api from "../../api";

export default function Members() {
    const [members, setMembers] = useState([]);
    const [query, setQuery] = useState("");
    const [filterGroup, setFilterGroup] = useState("All");
    const [filterRole, setFilterRole] = useState("All");
    const [selected, setSelected] = useState(null);

    useEffect(() => {
        api.get("/organization/members/")
            .then((res) => {
                const normalized = res.data.map(m => ({
                    ...m,
                    status: m.status === "active"
                        ? "Active"
                        : m.status === "pending"
                        ? "Pending"
                        : "Suspended",
                }));
                setMembers(normalized);
            })
            .catch(console.error);
    }, []);

    const [page, setPage] = useState(1);
    const perPage = 8;

    const stats = useMemo(() => {
        const total = members.length;
        const active = members.filter((m) => m.status === "Active").length;
        const suspended = members.filter((m) => m.status === "Suspended").length;
        const now = new Date();
        const last7 = members.filter((m) => {
            const d = new Date(m.joinedAt);
            const diff = (now - d) / (1000 * 60 * 60 * 24);
            return diff <= 7;
        }).length;
        return { total, active, suspended, last7 };
    }, [members]);

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        return members.filter((m) => {
            if (q && !(m.full_name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q))) return false;
            if (filterGroup !== "All" && !m.groups.includes(filterGroup)) return false;
            if (filterRole !== "All" && m.role !== filterRole) return false;
            return true;
        });
    }, [members, query, filterGroup, filterRole]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
    const pageData = filtered.slice((page - 1) * perPage, page * perPage);

    const openDetails = (member) => setSelected(member);

    const updateStatus = async (member, status) => {
        try {
            await api.patch(`/organization/members/${member.id}/status/`, { status });
            setMembers(prev =>
                prev.map(m =>
                    m.id === member.id
                        ? { ...m, status: status.charAt(0).toUpperCase() + status.slice(1) }
                        : m
                )
            );
        } catch (err) {
            alert("Failed to update status");
        }
    };

    const removeMember = async (member) => {
        if (!window.confirm("This will remove the user from the organization and ALL groups. Continue?")) return;
        try {
            await api.delete(`/organization/members/${member.id}/remove/`);
            setMembers(prev => prev.filter(m => m.id !== member.id));
        } catch (err) {
            alert("Failed to remove member");
        }
    };

    return (
        <div className="p-4 sm:p-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Members</h2>
                    <p className="text-sm text-gray-500 mt-1">Manage organization members, roles and activity.</p>
                </div>
            </div>

            {/* Summary cards as grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard title="Total Members" value={stats.total} icon={<FiUsers />} />
                <StatCard title="Active Members" value={stats.active} icon={<FiUserCheck />} />
                <StatCard title="Suspended" value={stats.suspended} icon={<FiUserX />} />
                <StatCard title="Joined (7d)" value={stats.last7} icon={<FiUserPlus />} />
            </div>

            {/* Search */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div className="relative w-72 md:w-2/3">
                    <FiSearch className="absolute left-3 top-3 text-gray-400" />
                    <input
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-100"
                        placeholder="Search by name, email..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                    />
                </div>
            </div>

            {/* Members Table */}
            <div className=" w-72 md:w-full bg-white rounded-2xl shadow border border-gray-100 overflow-x-auto">
                <table className="w-full min-w-full text-sm table-auto">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-3 text-left">Member</th>
                            <th className="px-4 py-3 text-left">Groups</th>
                            <th className="px-4 py-3 text-left">Role</th>
                            <th className="px-4 py-3 text-left">Status</th>
                            <th className="px-4 py-3 text-left">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {pageData.length === 0 && (
                            <tr>
                                <td colSpan="5" className="px-4 py-6 text-center text-gray-500">
                                    No members found.
                                </td>
                            </tr>
                        )}
                        {pageData.map((m) => (
                            <tr key={m.id} className="border border-gray-200 hover:bg-gray-50">
                                <td className="px-4 py-3 flex items-center gap-3 min-w-[0]" onClick={() => openDetails(m)}>
                                    {m.avatar ? (
                                        <img src={m.avatar} alt="" className="w-10 h-10 rounded-full flex-shrink-0" />
                                    ) : (
                                        <div className="w-10 h-10 rounded-full bg-indigo-500 text-white flex items-center justify-center font-semibold text-lg flex-shrink-0">
                                            {(m.full_name || "U").charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                    <div className="truncate">
                                        <div className="font-semibold text-gray-900 truncate">{m.full_name}</div>
                                        <div className="text-xs text-gray-500 truncate">{m.id}</div>
                                        <div className="text-xs text-gray-500 truncate">{m.email}</div>
                                    </div>
                                </td>

                                <td className="px-4 py-3">
                                    <div className="flex gap-2 flex-wrap">
                                        {m.groups.map((g) => (
                                            <span
                                                key={g.id}
                                                className={`text-xs px-2 py-1 rounded-full
                                                    ${g.status === "pending"
                                                        ? "bg-yellow-100 text-yellow-700"
                                                        : g.status === "suspended"
                                                        ? "bg-red-100 text-red-700"
                                                        : "bg-indigo-50 text-indigo-700"
                                                    }`}
                                            >
                                                {g.name}
                                            </span>
                                        ))}
                                    </div>
                                </td>

                                <td className="px-4 py-3">{m.role}</td>

                                <td className="px-4 py-3">
                                    <span className={`px-2 py-1 rounded-full text-xs 
                                        ${m.status === "Active" ? "bg-green-100 text-green-700" :
                                            m.status === "Pending" ? "bg-yellow-100 text-yellow-700" :
                                                "bg-red-100 text-red-700"}`}>
                                        {m.status}
                                    </span>
                                </td>

                                <td className="px-4 py-3 flex gap-2 flex-wrap">
                                    {m.status === "Pending" && (
                                        <button
                                            onClick={() => updateStatus(m, "active")}
                                            className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded-lg"
                                        >
                                            Approve
                                        </button>
                                    )}
                                    {m.status === "Active" && (
                                        <button
                                            onClick={() => updateStatus(m, "suspended")}
                                            className="px-3 py-1 text-xs bg-yellow-100 text-yellow-700 rounded-lg"
                                        >
                                            Suspend
                                        </button>
                                    )}
                                    {m.status === "Suspended" && (
                                        <button
                                            onClick={() => updateStatus(m, "active")}
                                            className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded-lg"
                                        >
                                            Re-Activate
                                        </button>
                                    )}
                                    <button
                                        onClick={() => removeMember(m)}
                                        className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded-lg"
                                    >
                                        Remove
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* Pagination */}
                <div className="px-4 py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0 bg-gray-50">
                    <div className="text-sm text-gray-600">
                        Showing {(page - 1) * perPage + 1} - {Math.min(page * perPage, filtered.length)} of {filtered.length}
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                        <button
                            disabled={page === 1}
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            className="px-3 py-1 rounded-md border bg-white disabled:opacity-50"
                        >
                            Prev
                        </button>
                        <div className="px-3 py-1 text-sm border rounded-md bg-white">{page}</div>
                        <button
                            disabled={page === totalPages}
                            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                            className="px-3 py-1 rounded-md border bg-white disabled:opacity-50"
                        >
                            Next
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Stat Card Component as grid item
function StatCard({ title, value, icon }) {
    return (
        <div className="w-72 md:w-full flex items-center gap-3 p-4 bg-white border border-gray-100 rounded-2xl shadow">
            <div className="p-3 rounded-full bg-indigo-50 text-indigo-700 text-xl">{icon}</div>
            <div>
                <div className="text-sm text-gray-500">{title}</div>
                <div className="font-semibold text-gray-900">{value}</div>
            </div>
        </div>
    );
}
