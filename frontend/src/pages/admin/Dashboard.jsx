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
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const StatCard = ({ icon: Icon, label, value, color, bgColor }) => (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{label}</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
        </div>
        <div className={`p-3 rounded-lg ${bgColor}`}>
          <Icon className={`w-6 h-6 ${color}`} />
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
    <div className="space-y-6 animate-fadeIn">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">Overview of the complaint portal</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={FiUsers}
          label="Total Students"
          value={stats?.totalStudents || 0}
          color="text-primary-600"
          bgColor="bg-primary-50"
        />
        <StatCard
          icon={FiMessageSquare}
          label="Total Complaints"
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
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Complaints by Status</h2>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <FiEye className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-blue-700">{stats?.byStatus?.read || 0}</p>
            <p className="text-sm text-blue-600">Read</p>
          </div>
          <div className="text-center p-4 bg-yellow-50 rounded-lg">
            <FiClock className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-yellow-700">{stats?.byStatus?.underReview || 0}</p>
            <p className="text-sm text-yellow-600">Under Review</p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <FiCheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-green-700">{stats?.byStatus?.resolved || 0}</p>
            <p className="text-sm text-green-600">Resolved</p>
          </div>
        </div>
      </div>

      {/* Recent Complaints */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Recent Complaints</h2>
            <Link 
              href="/admin/complaints" 
              className="text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              View All →
            </Link>
          </div>
        </div>
        <div className="divide-y divide-gray-100">
          {recentComplaints.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No complaints yet
            </div>
          ) : (
            recentComplaints.map((complaint) => (
              <div key={complaint._id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">
                      {complaint.userId?.name || 'Unknown User'}
                    </p>
                    <p className="text-sm text-gray-500 truncate mt-1">
                      {complaint.content.substring(0, 100)}...
                    </p>
                    <p className="text-xs text-gray-400 mt-2">
                      {new Date(complaint.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                  <div className="ml-4 flex-shrink-0">
                    <StatusBadge status={complaint.status} />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link
            href="/admin/students"
          className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow group"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary-50 rounded-lg group-hover:bg-primary-100 transition-colors">
              <FiUsers className="w-6 h-6 text-primary-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Manage Students</h3>
              <p className="text-sm text-gray-500">Add students individually or via CSV</p>
            </div>
          </div>
        </Link>
        <Link
          href="/admin/complaints"
          className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow group"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-50 rounded-lg group-hover:bg-purple-100 transition-colors">
              <FiMessageSquare className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Review Complaints</h3>
              <p className="text-sm text-gray-500">View and respond to student complaints</p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
};

export default AdminDashboard;
