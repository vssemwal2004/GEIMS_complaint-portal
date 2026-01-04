import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { 
  FiMessageSquare, 
  FiEye, 
  FiClock, 
  FiCheckCircle, 
  FiPlusCircle,
  FiUser
} from 'react-icons/fi';

const StudentDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [recentComplaints, setRecentComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, complaintsRes] = await Promise.all([
          api.get('/api/student/stats'),
          api.get('/api/student/complaints?limit=5'),
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
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-primary-500 to-secondary-600 rounded-xl p-6 text-white">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Welcome back, {user?.name?.split(' ')[0]}!</h1>
            <p className="text-primary-100 mt-1">
              Track your complaints and submit new feedback
            </p>
          </div>
          <Link
            to="/student/submit"
            className="inline-flex items-center gap-2 px-6 py-3 bg-white text-primary-600 font-medium rounded-lg hover:bg-primary-50 transition-colors"
          >
            <FiPlusCircle size={20} />
            Submit New Complaint
          </Link>
        </div>
      </div>

      {/* Profile Card */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center">
            <FiUser className="w-8 h-8 text-primary-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{user?.name}</h3>
            <p className="text-gray-500">{user?.email}</p>
            <p className="text-sm text-gray-400">{user?.college}</p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={FiMessageSquare}
          label="Total Complaints"
          value={stats?.totalComplaints || 0}
          color="text-primary-600"
          bgColor="bg-primary-50"
        />
        <StatCard
          icon={FiEye}
          label="Read"
          value={stats?.byStatus?.read || 0}
          color="text-blue-600"
          bgColor="bg-blue-50"
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

      {/* Recent Complaints */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Recent Complaints</h2>
            <Link 
              to="/student/complaints" 
              className="text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              View All →
            </Link>
          </div>
        </div>
        <div className="divide-y divide-gray-100">
          {recentComplaints.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <FiMessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No complaints submitted yet</p>
              <Link
                to="/student/submit"
                className="mt-4 inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium"
              >
                <FiPlusCircle />
                Submit your first complaint
              </Link>
            </div>
          ) : (
            recentComplaints.map((complaint) => (
              <div key={complaint._id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 line-clamp-2">
                      {complaint.content.substring(0, 150)}...
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
                  <div className="flex-shrink-0">
                    <StatusBadge status={complaint.status} />
                  </div>
                </div>
                {complaint.status === 'RESOLVED' && complaint.acknowledgment && (
                  <div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-100">
                    <p className="text-xs font-medium text-green-700 mb-1">Admin Response:</p>
                    <p className="text-sm text-green-800">{complaint.acknowledgment}</p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link
          to="/student/submit"
          className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow group"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary-50 rounded-lg group-hover:bg-primary-100 transition-colors">
              <FiPlusCircle className="w-6 h-6 text-primary-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Submit Complaint</h3>
              <p className="text-sm text-gray-500">Report an issue or provide feedback</p>
            </div>
          </div>
        </Link>
        <Link
          to="/student/complaints"
          className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow group"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-50 rounded-lg group-hover:bg-purple-100 transition-colors">
              <FiMessageSquare className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">View All Complaints</h3>
              <p className="text-sm text-gray-500">Track status of your submissions</p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
};

export default StudentDashboard;
