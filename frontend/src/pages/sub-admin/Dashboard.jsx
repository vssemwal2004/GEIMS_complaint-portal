import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import Link from 'next/link';
import api from '../../services/api';
import { FiUsers, FiMessageSquare, FiEye, FiClock, FiCheckCircle } from 'react-icons/fi';

const SubAdminDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await api.get('/api/sub-admin/stats');
        if (response.data.success) {
          setStats(response.data.data.stats);
        }
      } catch {
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const StatCard = ({ icon: Icon, label, value, color, bgColor }) => (
    <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
        </div>
        <div className={`p-2.5 rounded-lg ${bgColor}`}>
          <Icon className={`w-5 h-5 ${color}`} />
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-600 mt-0.5">
          Welcome back, {user?.name} • Department: {stats?.department || 'N/A'}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          icon={FiUsers}
          label="Students"
          value={stats?.totalStudents || 0}
          color="text-blue-600"
          bgColor="bg-blue-50"
        />
        <StatCard
          icon={FiUsers}
          label="Employees"
          value={stats?.totalEmployees || 0}
          color="text-teal-600"
          bgColor="bg-teal-50"
        />
        <StatCard
          icon={FiMessageSquare}
          label="Complaints"
          value={stats?.totalComplaints || 0}
          color="text-purple-600"
          bgColor="bg-purple-50"
        />
        <StatCard
          icon={FiClock}
          label="Pending"
          value={(stats?.byStatus?.read || 0) + (stats?.byStatus?.underReview || 0)}
          color="text-yellow-600"
          bgColor="bg-yellow-50"
        />
      </div>

      {/* Status Breakdown */}
      <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
        <h2 className="text-base font-semibold text-gray-900 mb-3">Complaints by Status</h2>
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-100">
            <FiEye className="w-6 h-6 text-blue-600 mx-auto mb-1.5" />
            <p className="text-xl font-bold text-blue-700">{stats?.byStatus?.read || 0}</p>
            <p className="text-xs text-blue-600 font-medium">Read</p>
          </div>
          <div className="text-center p-3 bg-yellow-50 rounded-lg border border-yellow-100">
            <FiClock className="w-6 h-6 text-yellow-600 mx-auto mb-1.5" />
            <p className="text-xl font-bold text-yellow-700">{stats?.byStatus?.underReview || 0}</p>
            <p className="text-xs text-yellow-600 font-medium">Under Review</p>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg border border-green-100">
            <FiCheckCircle className="w-6 h-6 text-green-600 mx-auto mb-1.5" />
            <p className="text-xl font-bold text-green-700">{stats?.byStatus?.resolved || 0}</p>
            <p className="text-xs text-green-600 font-medium">Resolved</p>
          </div>
        </div>
      </div>

      {/* Department Info */}
      <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
        <h2 className="text-base font-semibold text-gray-900 mb-3">Department Information</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-start gap-3 p-3 bg-indigo-50 rounded-lg border border-indigo-100">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div>
              <p className="text-xs text-indigo-600 font-medium">Department</p>
              <p className="text-sm font-semibold text-indigo-900">{stats?.department || 'N/A'}</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg border border-purple-100">
            <div className="p-2 bg-purple-100 rounded-lg">
              <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div>
              <p className="text-xs text-purple-600 font-medium">Role</p>
              <p className="text-sm font-semibold text-purple-900">Sub-Admin</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Link
          href="/sub-admin/complaints"
          className="bg-white rounded-lg shadow-sm p-4 border border-gray-200 hover:shadow-md hover:border-indigo-300 transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 rounded-lg group-hover:bg-indigo-100 transition-colors">
              <FiMessageSquare className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">View Complaints</h3>
              <p className="text-xs text-gray-500">Manage department complaints</p>
            </div>
          </div>
        </Link>
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-50 rounded-lg">
              <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Download Reports</h3>
              <p className="text-xs text-gray-500">Available in complaints page</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubAdminDashboard;
