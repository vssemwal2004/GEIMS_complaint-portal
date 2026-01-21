import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import api from '../../services/api';
import toast from 'react-hot-toast';
import ComplaintRating from '../../components/ComplaintRating';
import ReopenComplaintModal from '../../components/ReopenComplaintModal';
import { 
  FiX, FiStar, FiCheckCircle, FiRotateCw
} from 'react-icons/fi';

const EmployeeComplaints = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ current: 1, pages: 1, total: 0 });
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showReopenModal, setShowReopenModal] = useState(false);
  const [reopeningComplaintId, setReopeningComplaintId] = useState(null);

  const fetchComplaints = useCallback(async (page = 1, status = 'all') => {
    setLoading(true);
    try {
      const response = await api.get('/api/employee/complaints', {
        params: { page, limit: 10, status },
      });

      if (response.data.success) {
        setComplaints(response.data.data.complaints);
        setPagination(response.data.data.pagination);
      }
    } catch {
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

  const handleRate = async (complaintId, rating) => {
    try {
      const response = await api.post(`/api/employee/complaints/${complaintId}/rate`, { rating });
      if (response.data.success) {
        toast.success('Rating submitted successfully!');
        fetchComplaints(pagination.current, statusFilter);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to rate complaint');
    }
  };

  const handleAcknowledge = async (complaintId) => {
    try {
      const response = await api.post(`/api/employee/complaints/${complaintId}/acknowledge`);
      if (response.data.success) {
        toast.success('Complaint acknowledged!');
        fetchComplaints(pagination.current, statusFilter);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to acknowledge complaint');
    }
  };

  const handleReopenClick = (complaintId) => {
    setReopeningComplaintId(complaintId);
    setShowReopenModal(true);
  };

  const handleReopen = async (remarks) => {
    if (!reopeningComplaintId) return;

    try {
      const response = await api.post(`/api/employee/complaints/${reopeningComplaintId}/reopen`, {
        reopenRemarks: remarks
      });
      if (response.data.success) {
        toast.success('Complaint reopened successfully!');
        setShowReopenModal(false);
        setReopeningComplaintId(null);
        fetchComplaints(pagination.current, statusFilter);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reopen complaint');
    }
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

    const isResolved = selectedComplaint.status === 'RESOLVED';
    const hasRated = selectedComplaint.rating > 0;
    const isAcknowledged = selectedComplaint.acknowledgedByEmployee;

    return (
      <div className="fixed inset-0 z-50">
        <div className="absolute inset-0 bg-black/40" onClick={() => setShowDetailModal(false)} />
        <div className="relative flex items-center justify-center min-h-full p-4">
          <div className="w-full max-w-3xl bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center gap-3">
                <h3 className="text-base font-semibold text-gray-900">
                  {selectedComplaint.complaintId || 'Complaint Details'}
                </h3>
                <StatusBadge status={selectedComplaint.status} />
              </div>
              <button
                type="button"
                onClick={() => setShowDetailModal(false)}
                className="w-9 h-9 inline-flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
                aria-label="Close"
              >
                <FiX size={20} />
              </button>
            </div>

            {/* Body - Scrollable */}
            <div className="flex-1 overflow-y-auto px-5 py-5">
              <div className="space-y-5">
                {/* Metadata */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-lg px-4 py-3 border border-gray-200">
                    <p className="text-xs text-gray-500 font-medium">Complaint ID</p>
                    <p className="text-sm font-semibold text-gray-900 mt-1 font-mono">
                      {selectedComplaint.complaintId || selectedComplaint._id}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg px-4 py-3 border border-gray-200">
                    <p className="text-xs text-gray-500 font-medium">Submitted On</p>
                    <p className="text-sm font-semibold text-gray-900 mt-1">
                      {new Date(selectedComplaint.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>

                {/* Subject */}
                {selectedComplaint.subject && (
                  <div>
                    <p className="text-xs text-gray-500 font-medium mb-2">Subject</p>
                    <div className="bg-white rounded-lg border border-gray-200 px-4 py-3">
                      <p className="text-sm font-medium text-gray-900">{selectedComplaint.subject}</p>
                    </div>
                  </div>
                )}

                {/* Complaint Content */}
                <div>
                  <p className="text-xs text-gray-500 font-medium mb-2">Complaint Details</p>
                  <div className="bg-gray-50 rounded-lg border border-gray-200 px-4 py-3">
                    <p className="text-sm text-gray-900 whitespace-pre-wrap leading-relaxed">{selectedComplaint.content}</p>
                  </div>
                </div>

                {/* Admin Response */}
                {selectedComplaint.acknowledgment && (
                  <div>
                    <p className="text-xs text-gray-500 font-medium mb-2">Admin Response</p>
                    <div className="bg-emerald-50 rounded-lg border border-emerald-200 px-4 py-3">
                      <p className="text-sm text-emerald-900 whitespace-pre-wrap leading-relaxed">{selectedComplaint.acknowledgment}</p>
                    </div>
                  </div>
                )}

                {/* Resolution Actions - Only for RESOLVED complaints */}
                {isResolved && (
                  <div className="border-t border-gray-200 pt-5 mt-5">
                    <h4 className="text-sm font-semibold text-gray-900 mb-4">Resolution Feedback</h4>
                    
                    <div className="space-y-4">
                      {/* Rating Section */}
                      <div className="bg-amber-50 rounded-lg border border-amber-200 px-4 py-4">
                        <p className="text-xs text-amber-900 font-medium mb-3">Rate the Resolution Quality</p>
                        <ComplaintRating
                          rating={selectedComplaint.rating || 0}
                          onRate={(rating) => handleRate(selectedComplaint._id, rating)}
                          disabled={hasRated}
                        />
                        {hasRated && (
                          <p className="text-xs text-amber-700 mt-2 flex items-center gap-1">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            You rated this resolution {selectedComplaint.rating} stars
                          </p>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-col sm:flex-row gap-3">
                        {!isAcknowledged ? (
                          <button
                            onClick={() => {
                              handleAcknowledge(selectedComplaint._id);
                              setShowDetailModal(false);
                            }}
                            className="flex-1 px-4 py-2.5 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 transition-colors flex items-center justify-center gap-2"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                            </svg>
                            Acknowledge Resolution
                          </button>
                        ) : (
                          <div className="flex-1 px-4 py-2.5 bg-teal-50 border border-teal-200 text-teal-700 text-sm font-medium rounded-lg text-center flex items-center justify-center gap-2">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            Acknowledged on {new Date(selectedComplaint.acknowledgedAt).toLocaleDateString()}
                          </div>
                        )}
                        
                        <button
                          onClick={() => {
                            setShowDetailModal(false);
                            handleReopenClick(selectedComplaint._id);
                          }}
                          className="px-4 py-2.5 bg-white border-2 border-orange-600 text-orange-600 text-sm font-medium rounded-lg hover:bg-orange-50 transition-colors flex items-center justify-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          Reopen Complaint
                        </button>
                      </div>

                      <p className="text-xs text-gray-500 text-center">
                        Not satisfied with the resolution? You can reopen this complaint to provide additional feedback.
                      </p>
                    </div>
                  </div>
                )}
              </div>
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
            href="/employee/submit"
            className="inline-flex items-center px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-lg hover:opacity-90"
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
            idle: 'bg-teal-50/40 text-teal-800 border-teal-100',
            active: 'bg-teal-50 text-teal-800 border-teal-300',
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
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-teal-600 mx-auto" />
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
                <div key={complaint._id} className="px-4 py-3 hover:bg-white/60">
                  <button
                    type="button"
                    onClick={() => handleViewDetails(complaint)}
                    className="w-full text-left"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-teal-600">{complaint.complaintId}</p>
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
                  
                  {/* Mobile Action Buttons */}
                  {complaint.status === 'RESOLVED' && (
                    <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-100">
                      {!complaint.rating && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewDetails(complaint);
                          }}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors"
                          title="Rate Resolution"
                        >
                          <FiStar className="w-3.5 h-3.5" />
                          <span>Rate</span>
                        </button>
                      )}
                      
                      {!complaint.acknowledgedByEmployee && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAcknowledge(complaint._id);
                          }}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-teal-700 bg-teal-50 border border-teal-200 rounded-lg hover:bg-teal-100 transition-colors"
                          title="Acknowledge Resolution"
                        >
                          <FiCheckCircle className="w-3.5 h-3.5" />
                          <span>Acknowledge</span>
                        </button>
                      )}
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleReopenClick(complaint._id);
                        }}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-orange-700 bg-white border border-orange-600 rounded-lg hover:bg-orange-50 transition-colors"
                        title="Reopen Complaint"
                      >
                        <FiRotateCw className="w-3.5 h-3.5" />
                        <span>Reopen</span>
                      </button>
                    </div>
                  )}
                </div>
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
                    <th className="text-left font-medium px-4 py-2">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {complaints.map((complaint) => (
                    <tr
                      key={complaint._id}
                      className="hover:bg-white/60"
                    >
                      <td 
                        className="px-4 py-3 text-teal-600 font-medium whitespace-nowrap cursor-pointer"
                        onClick={() => handleViewDetails(complaint)}
                      >
                        {complaint.complaintId || complaint._id.slice(-8)}
                      </td>
                      <td 
                        className="px-4 py-3 text-gray-600 whitespace-nowrap cursor-pointer"
                        onClick={() => handleViewDetails(complaint)}
                      >
                        {new Date(complaint.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </td>
                      <td 
                        className="px-4 py-3 text-gray-900 cursor-pointer"
                        onClick={() => handleViewDetails(complaint)}
                      >
                        <span className="line-clamp-1">{complaint.subject || complaint.content}</span>
                      </td>
                      <td 
                        className="px-4 py-3 whitespace-nowrap cursor-pointer"
                        onClick={() => handleViewDetails(complaint)}
                      >
                        <StatusBadge status={complaint.status} />
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {complaint.status === 'RESOLVED' ? (
                          <div className="flex items-center gap-1.5">
                            {!complaint.rating && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleViewDetails(complaint);
                                }}
                                className="p-1.5 text-amber-600 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors"
                                title="Rate Resolution"
                              >
                                <FiStar className="w-4 h-4" />
                              </button>
                            )}
                            
                            {!complaint.acknowledgedByEmployee && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleAcknowledge(complaint._id);
                                }}
                                className="p-1.5 text-teal-600 hover:text-teal-700 hover:bg-teal-50 rounded-lg transition-colors"
                                title="Acknowledge Resolution"
                              >
                                <FiCheckCircle className="w-4 h-4" />
                              </button>
                            )}
                            
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleReopenClick(complaint._id);
                              }}
                              className="p-1.5 text-orange-600 hover:text-orange-700 hover:bg-orange-50 rounded-lg transition-colors"
                              title="Reopen Complaint"
                            >
                              <FiRotateCw className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">-</span>
                        )}
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
      
      {/* Reopen Modal */}
      {showReopenModal && (
        <ReopenComplaintModal
          onReopen={handleReopen}
          onClose={() => {
            setShowReopenModal(false);
            setReopeningComplaintId(null);
          }}
        />
      )}
    </div>
  );
};

export default EmployeeComplaints;
