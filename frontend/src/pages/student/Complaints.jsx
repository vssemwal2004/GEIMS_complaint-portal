import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import api from '../../services/api';
import { 
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
    const labels = {
      READ: 'Read',
      UNDER_REVIEW: 'Under Review',
      RESOLVED: 'Resolved',
    };

    const styles = {
      READ: 'text-blue-700 bg-blue-50',
      UNDER_REVIEW: 'text-yellow-700 bg-yellow-50',
      RESOLVED: 'text-green-700 bg-green-50',
    };

    return (
      <span className={`inline-flex items-center gap-2 px-2.5 py-1 text-xs font-medium rounded-full ${styles[status]}`}>
        <span
          className={`w-1.5 h-1.5 rounded-full ${
            status === 'READ'
              ? 'bg-blue-600'
              : status === 'UNDER_REVIEW'
                ? 'bg-yellow-600'
                : 'bg-green-600'
          }`}
        />
        <span>{labels[status]}</span>
      </span>
    );
  };

  // Complaint Detail Modal
  const ComplaintDetailModal = () => {
    if (!selectedComplaint) return null;

    return (
      <div className="fixed inset-0 z-50">
        <div className="absolute inset-0 bg-black/40" onClick={() => setShowDetailModal(false)} />
        <div className="relative flex items-center justify-center min-h-full p-4">
          <div className="w-full max-w-2xl bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <h3 className="text-sm font-semibold text-gray-900">
                  {selectedComplaint.complaintId || 'Complaint Details'}
                </h3>
                <StatusBadge status={selectedComplaint.status} />
              </div>
              <button
                type="button"
                onClick={() => setShowDetailModal(false)}
                className="w-9 h-9 inline-flex items-center justify-center rounded-lg hover:bg-gray-50 text-gray-600"
                aria-label="Close"
              >
                <FiX size={18} />
              </button>
            </div>

            <div className="px-4 py-4 space-y-4">
              <div className="flex gap-4">
                <div className="flex-1">
                  <p className="text-xs text-gray-500">Complaint ID</p>
                  <p className="text-sm font-medium text-gray-900 mt-1">
                    {selectedComplaint.complaintId || selectedComplaint._id}
                  </p>
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-500">Submitted</p>
                  <p className="text-sm text-gray-900 mt-1">
                    {new Date(selectedComplaint.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>

              {selectedComplaint.subject && (
                <div>
                  <p className="text-xs text-gray-500">Subject</p>
                  <p className="text-sm font-medium text-gray-900 mt-1">{selectedComplaint.subject}</p>
                </div>
              )}

              <div>
                <p className="text-xs text-gray-500">Complaint Details</p>
                <div className="mt-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-3">
                  <p className="text-sm text-gray-900 whitespace-pre-wrap">{selectedComplaint.content}</p>
                </div>
              </div>

              {selectedComplaint.imageUrl && (
                <div>
                  <p className="text-xs text-gray-500">Attachment</p>
                  <div className="mt-2 rounded-lg border border-gray-200 bg-gray-50 overflow-hidden">
                    <img
                      src={selectedComplaint.imageUrl}
                      alt="Complaint attachment"
                      className="w-full max-h-80 object-contain"
                    />
                  </div>
                </div>
              )}

              {selectedComplaint.acknowledgment && (
                <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-3">
                  <p className="text-xs font-medium text-gray-700">Admin Response</p>
                  <p className="text-sm text-gray-900 mt-2 whitespace-pre-wrap">{selectedComplaint.acknowledgment}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">My Complaints</h1>
            <p className="text-sm text-gray-600 mt-1">View and track submitted complaints</p>
          </div>
          <Link
            href="/student/submit"
            className="inline-flex items-center px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:opacity-90"
          >
            Submit
          </Link>
        </div>
        <div className="h-px bg-gray-200 mt-4" />
      </div>

      {/* Status Tabs */}
      <div className="grid grid-cols-4 gap-2">
        {[
          {
            key: 'all',
            label: 'All',
            idle: 'bg-primary-50/40 text-primary-800 border-primary-100',
            active: 'bg-primary-50 text-primary-800 border-primary-300',
          },
          {
            key: 'READ',
            label: 'Read',
            idle: 'bg-blue-50 text-blue-800 border-blue-100',
            active: 'bg-blue-50 text-blue-800 border-blue-300',
          },
          {
            key: 'UNDER_REVIEW',
            label: 'Under Review',
            idle: 'bg-yellow-50 text-yellow-800 border-yellow-100',
            active: 'bg-yellow-50 text-yellow-800 border-yellow-300',
          },
          {
            key: 'RESOLVED',
            label: 'Resolved',
            idle: 'bg-green-50 text-green-800 border-green-100',
            active: 'bg-green-50 text-green-800 border-green-300',
          },
        ].map((item) => {
          const isActive = statusFilter === item.key;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => setStatusFilter(item.key)}
              className={`min-w-0 px-2 py-1.5 sm:px-3 sm:py-2 rounded-full border text-[10px] sm:text-xs font-medium whitespace-nowrap ${
                isActive ? item.active : item.idle
              }`}
              title={item.label}
            >
              <span className="block truncate">{item.label}</span>
            </button>
          );
        })}
      </div>

      <div className="bg-gray-50 border border-gray-200 rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary-600 mx-auto" />
          </div>
        ) : complaints.length === 0 ? (
          <div className="px-4 py-8">
            <div className="border border-dashed border-gray-200 rounded-lg bg-white/70 px-4 py-6 text-center">
              <p className="text-sm text-gray-700">No complaints found.</p>
              <p className="text-xs text-gray-500 mt-1">Submit a complaint to track it here.</p>
            </div>
          </div>
        ) : (
          <>
            {/* Mobile list */}
            <div className="md:hidden divide-y divide-gray-200">
              {complaints.map((complaint) => (
                <button
                  key={complaint._id}
                  type="button"
                  onClick={() => handleViewDetails(complaint)}
                  className="w-full text-left px-4 py-3 hover:bg-white/60"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-primary-600">{complaint.complaintId}</p>
                      <p className="text-sm text-gray-900 line-clamp-1 mt-0.5">{complaint.subject || complaint.content}</p>
                    </div>
                    <StatusBadge status={complaint.status} />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(complaint.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </p>
                </button>
              ))}
            </div>

            {/* Desktop table */}
            <div className="hidden md:block">
              <table className="min-w-full text-sm">
                <thead className="text-xs text-gray-600">
                  <tr className="border-b border-gray-200 bg-white/60">
                    <th className="text-left font-medium px-4 py-2">ID</th>
                    <th className="text-left font-medium px-4 py-2">Date</th>
                    <th className="text-left font-medium px-4 py-2">Subject</th>
                    <th className="text-left font-medium px-4 py-2">Status</th>
                    <th className="text-left font-medium px-4 py-2">Attachment</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {complaints.map((complaint) => (
                    <tr
                      key={complaint._id}
                      className="hover:bg-white/60 cursor-pointer"
                      onClick={() => handleViewDetails(complaint)}
                    >
                      <td className="px-4 py-3 text-primary-600 font-medium whitespace-nowrap">
                        {complaint.complaintId || complaint._id.slice(-8)}
                      </td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                        {new Date(complaint.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </td>
                      <td className="px-4 py-3 text-gray-900">
                        <span className="line-clamp-1">{complaint.subject || complaint.content}</span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <StatusBadge status={complaint.status} />
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {complaint.imageUrl ? 'Yes' : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Page {pagination.current} of {pagination.pages} ({pagination.total} total)
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => handlePageChange(pagination.current - 1)}
                disabled={pagination.current === 1}
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm disabled:opacity-50 hover:bg-gray-50"
              >
                Previous
              </button>
              <button
                onClick={() => handlePageChange(pagination.current + 1)}
                disabled={pagination.current === pagination.pages}
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm disabled:opacity-50 hover:bg-gray-50"
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
