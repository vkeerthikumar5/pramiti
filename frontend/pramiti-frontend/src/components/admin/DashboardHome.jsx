import { useState,useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  FiUsers,
  FiUserCheck,
  FiFolder,
  FiFileText,
  FiHelpCircle,
  FiCpu,
} from "react-icons/fi";
import api from "../../api";
export default function DashboardHome() {
    const [dashboard, setDashboard] = useState(null);

useEffect(() => {
  api.get("/admin/dashboard/")
    .then(res => setDashboard(res.data))
    .catch(err => console.error(err));
}, []);
if (!dashboard) {
  return (
    <div className="h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
        <p className="text-sm text-indigo-600 font-medium">
          Loading dashboard...
        </p>
      </div>
    </div>
  );
}

const stats = {
  employees: dashboard.stats.total_employees,
  groups: dashboard.stats.total_groups,
  documents: dashboard.stats.total_documents,
  questionsToday: dashboard.stats.questions_today,
  total_questions:dashboard.stats.total_questions
};

  return (
    <div className="p-6 space-y-8">

      {/* Row 1 - Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        <SummaryCard icon={<FiUsers />} label="Employees" count={stats.employees} />
        <SummaryCard icon={<FiFolder />} label="Groups" count={stats.groups} />
        <SummaryCard icon={<FiFileText />} label="Documents" count={stats.documents} />
        <SummaryCard icon={<FiHelpCircle />} label="Total Questions" count={stats.total_questions} />
        <SummaryCard icon={<FiHelpCircle />} label="Questions Today" count={stats.questionsToday} />
       
      </div>

      {/* Row 2 - Charts */}
      <div >
     

<ChartCard
  title="AI Usage Trend"
  data={dashboard.ai_usage_over_time}
  dataKey="count"
/>

      </div>

      {/* Row 3 - Engagement Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <TableCard
  title="Most Viewed Documents"
  data={dashboard.most_viewed_documents}
  columns={["title", "views"]}
/>

<TableCard
  title="Most Confusing Documents"
  data={dashboard.most_confusing_documents}
  columns={["title", "questions"]}
/>

      </div>

      
    </div>
  );
}

function SummaryCard({ icon, label, count }) {
  return (
    <div className="bg-indigo-950 text-white rounded-lg p-5 flex flex-col items-start shadow hover:scale-[1.02] transition">
      <div className="text-3xl mb-2 opacity-80">{icon}</div>
      <p className="text-sm opacity-90">{label}</p>
      <p className="text-2xl font-bold">{count}</p>
    </div>
  );
}

function ChartCard({ title, data, dataKey }) {
  return (
    <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
      <h2 className="text-lg font-semibold mb-4 text-indigo-900">{title}</h2>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey={dataKey} stroke="#4f46e5" strokeWidth={3} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function TableCard({ title, data, columns }) {
  return (
    <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 overflow-x-auto">
      <h2 className="text-xl font-bold mb-4 text-indigo-900">{title}</h2>
      
      {data && data.length > 0 ? (
        <table className="min-w-full text-sm sm:text-base">
          <thead className="bg-indigo-50">
            <tr>
              {columns.map((c, i) => (
                <th
                  key={i}
                  className="text-left px-4 py-3 text-indigo-700 font-medium uppercase tracking-wider"
                >
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => (
              <tr
                key={i}
                className={`border-b border-gray-200 hover:bg-gray-50 transition-colors`}
              >
                {columns.map((c, j) => (
                  <td key={j} className="px-4 py-3">
                    {row[c] ?? "-"}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="text-center text-gray-500 py-8">No data available</p>
      )}
    </div>
  );
}



