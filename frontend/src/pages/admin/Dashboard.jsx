import { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '../../services/api';
import { FiUsers, FiMessageSquare, FiEye, FiClock, FiCheckCircle } from 'react-icons/fi';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [recentComplaints, setRecentComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, complaintsRes] = await Promise.all([
          api.get('/api/admin/stats'),
          api.get('/api/admin/complaints?limit=5'),
        ]);

        if (statsRes.data.success) {
          setStats(statsRes.data.data.stats);
        }
        if (complaintsRes.data.success) {
          setRecentComplaints(complaintsRes.data.data.complaints);
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

  const StatusBadge = ({ status }) => {
    const styles = {
      READ: 'bg-blue-100 text-blue-800',
      UNDER_REVIEW: 'bg-yellow-100 text-yellow-800',
      RESOLVED: 'bg-green-100 text-green-800',
    };

    const labels = {
      READ: 'Read',
      UNDER_REVIEW: 'Under Review',
      RESOLVED: 'Resolved',
    };

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[status]}`}>
        {labels[status]}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-600 mt-0.5">Overview of the complaint portal</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <StatCard
          icon={FiUsers}
          label="Students"
          value={stats?.totalStudents || 0}
          color="text-blue-600"
          bgColor="bg-blue-50"
        />
        <StatCard
          icon={FiUsers}
          label="Sub-Admins"
          value={stats?.totalSubAdmins || 0}
          color="text-indigo-600"
          bgColor="bg-indigo-50"
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
          label="Under Review"
          value={stats?.byStatus?.underReview || 0}
          color="text-yellow-600"
          bgColor="bg-yellow-50"
        />
        <StatCard
          icon={FiCheckCircle}
          label="Resolved"
          value={stats?.byStatus?.resolved || 0}
          color="text-green-600"
          bgColor="bg-green-50"
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

      {/* Recent Complaints */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900">Recent Complaints</h2>
          <Link 
            href="/admin/complaints" 
            className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
          >
            View All
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
        <div className="divide-y divide-gray-100">
          {recentComplaints.length === 0 ? (
            <div className="p-8 text-center">
              <FiMessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">No complaints yet</p>
            </div>
          ) : (
            recentComplaints.map((complaint) => (
              <div key={complaint._id} className="p-3 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="h-6 w-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-medium">
                        {complaint.userId?.name?.charAt(0) || '?'}
                      </div>
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {complaint.userId?.name || 'Unknown User'}
                      </p>
                    </div>
                    <p className="text-xs text-gray-600 line-clamp-2 ml-8">
                      {complaint.content.substring(0, 100)}...
                    </p>
                    <p className="text-xs text-gray-400 mt-1 ml-8">
                      {new Date(complaint.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                  <div className="flex-shrink-0">
                    <StatusBadge status={complaint.status} />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <Link
          href="/admin/students"
          className="bg-white rounded-lg shadow-sm p-4 border border-gray-200 hover:shadow-md hover:border-blue-300 transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition-colors">
              <FiUsers className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Students</h3>
              <p className="text-xs text-gray-500">Manage users</p>
            </div>
          </div>
        </Link>
        <Link
          href="/admin/sub-admins"
          className="bg-white rounded-lg shadow-sm p-4 border border-gray-200 hover:shadow-md hover:border-indigo-300 transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 rounded-lg group-hover:bg-indigo-100 transition-colors">
              <FiUsers className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Sub-Admins</h3>
              <p className="text-xs text-gray-500">Manage roles</p>
            </div>
          </div>
        </Link>
        <Link
          href="/admin/employees"
          className="bg-white rounded-lg shadow-sm p-4 border border-gray-200 hover:shadow-md hover:border-teal-300 transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-teal-50 rounded-lg group-hover:bg-teal-100 transition-colors">
              <FiUsers className="w-5 h-5 text-teal-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Employees</h3>
              <p className="text-xs text-gray-500">Manage staff</p>
            </div>
          </div>
        </Link>
        <Link
          href="/admin/complaints"
          className="bg-white rounded-lg shadow-sm p-4 border border-gray-200 hover:shadow-md hover:border-purple-300 transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-50 rounded-lg group-hover:bg-purple-100 transition-colors">
              <FiMessageSquare className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Complaints</h3>
              <p className="text-xs text-gray-500">Review issues</p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
};

export default AdminDashboard;
