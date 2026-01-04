import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { 
  FiMessageSquare, 
  FiFilter, 
  FiClock,
  FiCheckCircle,
  FiEye,
  FiImage,
  FiPlusCircle,
  FiX
} from 'react-icons/fi';

const StudentComplaints = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ current: 1, pages: 1, total: 0 });
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const fetchComplaints = useCallback(async (page = 1, status = 'all') => {
    setLoading(true);
    try {
      const response = await api.get('/api/student/complaints', {
        params: { page, limit: 10, status },
      });

      if (response.data.success) {
        setComplaints(response.data.data.complaints);
        setPagination(response.data.data.pagination);
      }
    } catch (error) {
      console.error('Failed to fetch complaints:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchComplaints(1, statusFilter);
  }, [fetchComplaints, statusFilter]);

  const handlePageChange = (page) => {
    fetchComplaints(page, statusFilter);
  };

  const handleViewDetails = (complaint) => {
    setSelectedComplaint(complaint);
    setShowDetailModal(true);
  };

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

    const icons = {
      READ: FiEye,
      UNDER_REVIEW: FiClock,
      RESOLVED: FiCheckCircle,
    };

    const Icon = icons[status];

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${styles[status]}`}>
        <Icon size={12} />
        {labels[status]}
      </span>
    );
  };

  // Complaint Detail Modal
  const ComplaintDetailModal = () => {
    if (!selectedComplaint) return null;

    return (
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex items-center justify-center min-h-screen px-4 py-6">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setShowDetailModal(false)} />
          
          <div className="relative bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto z-10">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-100 p-6 z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h3 className="text-xl font-semibold text-gray-900">Complaint Details</h3>
                  <StatusBadge status={selectedComplaint.status} />
                </div>
                <button onClick={() => setShowDetailModal(false)} className="text-gray-400 hover:text-gray-600">
                  <FiX size={24} />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Complaint Content */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Your Complaint</h4>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-gray-800 whitespace-pre-wrap">{selectedComplaint.content}</p>
                </div>
              </div>

              {/* Image Attachment */}
              {selectedComplaint.imageUrl && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Attached Image</h4>
                  <div className="border rounded-lg overflow-hidden">
                    <img
                      src={selectedComplaint.imageUrl}
                      alt="Complaint attachment"
                      className="max-w-full h-auto max-h-80 object-contain mx-auto"
                    />
                  </div>
                </div>
              )}

              {/* Timestamps */}
              <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <FiClock />
                  Submitted: {new Date(selectedComplaint.createdAt).toLocaleString()}
                </div>
                {selectedComplaint.resolvedAt && (
                  <div className="flex items-center gap-1 text-green-600">
                    <FiCheckCircle />
                    Resolved: {new Date(selectedComplaint.resolvedAt).toLocaleString()}
                  </div>
                )}
              </div>

              {/* Admin Acknowledgment */}
              {selectedComplaint.acknowledgment && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h4 className="text-sm font-medium text-green-700 mb-2 flex items-center gap-2">
                    <FiCheckCircle />
                    Admin Response
                  </h4>
                  <p className="text-green-800">{selectedComplaint.acknowledgment}</p>
                  {selectedComplaint.resolvedBy && (
                    <p className="text-xs text-green-600 mt-2">
                      Responded by: {selectedComplaint.resolvedBy.name}
                    </p>
                  )}
                </div>
              )}

              {/* Status Info */}
              {selectedComplaint.status !== 'RESOLVED' && (
                <div className={`p-4 rounded-lg ${
                  selectedComplaint.status === 'READ' 
                    ? 'bg-blue-50 border border-blue-200' 
                    : 'bg-yellow-50 border border-yellow-200'
                }`}>
                  <p className={`text-sm ${
                    selectedComplaint.status === 'READ' ? 'text-blue-700' : 'text-yellow-700'
                  }`}>
                    {selectedComplaint.status === 'READ' 
                      ? '✓ Your complaint has been received and read by the administration.'
                      : '⏳ Your complaint is currently being reviewed by the administration.'}
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t p-6">
              <button
                onClick={() => setShowDetailModal(false)}
                className="w-full px-4 py-2 gradient-primary text-white rounded-lg hover:opacity-90"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Complaints</h1>
          <p className="text-gray-500 mt-1">Track status of your submitted complaints</p>
        </div>
        <Link
          to="/student/submit"
          className="inline-flex items-center gap-2 px-4 py-2 gradient-primary text-white rounded-lg hover:opacity-90"
        >
          <FiPlusCircle size={18} />
          New Complaint
        </Link>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <FiFilter className="text-gray-400" />
          <span className="text-sm text-gray-600">Filter:</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {['all', 'READ', 'UNDER_REVIEW', 'RESOLVED'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                statusFilter === status
                  ? 'bg-primary-100 text-primary-700 font-medium'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {status === 'all' ? 'All' : status.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Complaints List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600 mx-auto"></div>
          </div>
        ) : complaints.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <FiMessageSquare className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p className="text-lg">No complaints found</p>
            <p className="text-sm mt-1 mb-4">
              {statusFilter !== 'all' ? `No ${statusFilter.replace('_', ' ').toLowerCase()} complaints` : 'You haven\'t submitted any complaints yet'}
            </p>
            <Link
              to="/student/submit"
              className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium"
            >
              <FiPlusCircle />
              Submit your first complaint
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {complaints.map((complaint) => (
              <div 
                key={complaint._id} 
                className="p-6 hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => handleViewDetails(complaint)}
              >
                <div className="flex flex-col gap-3">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <p className="text-gray-900 line-clamp-2">
                        {complaint.content.substring(0, 200)}
                        {complaint.content.length > 200 && '...'}
                      </p>
                    </div>
                    <StatusBadge status={complaint.status} />
                  </div>

                  {/* Meta Info */}
                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <FiClock size={14} />
                      {new Date(complaint.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                    {complaint.imageUrl && (
                      <span className="flex items-center gap-1 text-primary-600">
                        <FiImage size={14} />
                        Has attachment
                      </span>
                    )}
                    {complaint.acknowledgment && (
                      <span className="flex items-center gap-1 text-green-600">
                        <FiCheckCircle size={14} />
                        Response received
                      </span>
                    )}
                  </div>

                  {/* Admin Response Preview */}
                  {complaint.acknowledgment && (
                    <div className="p-3 bg-green-50 rounded-lg border border-green-100">
                      <p className="text-xs font-medium text-green-700 mb-1">Admin Response:</p>
                      <p className="text-sm text-green-800 line-clamp-2">{complaint.acknowledgment}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Page {pagination.current} of {pagination.pages} ({pagination.total} total)
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => handlePageChange(pagination.current - 1)}
                disabled={pagination.current === 1}
                className="px-3 py-1 border rounded text-sm disabled:opacity-50 hover:bg-gray-50"
              >
                Previous
              </button>
              <button
                onClick={() => handlePageChange(pagination.current + 1)}
                disabled={pagination.current === pagination.pages}
                className="px-3 py-1 border rounded text-sm disabled:opacity-50 hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {showDetailModal && <ComplaintDetailModal />}
    </div>
  );
};

export default StudentComplaints;
