import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../services/api';

const STATUS_TABS = [
  { key: 'all', label: 'All' },
  { key: 'READ', label: 'Read' },
  { key: 'UNDER_REVIEW', label: 'Under Review' },
  { key: 'RESOLVED', label: 'Resolved' },
];

const DATE_TABS = [
  { key: 'today', label: 'Today' },
  { key: 'week', label: 'This Week' },
  { key: 'month', label: 'Monthly' },
  { key: 'custom', label: 'Custom Date' },
];

const formatListDate = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const isWithinDateRange = ({ createdAt, dateFilter, customStartDate, customEndDate }) => {
  if (!createdAt) return true;
  const created = new Date(createdAt);
  if (Number.isNaN(created.getTime())) return true;

  const now = new Date();
  if (dateFilter === 'today') {
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return created >= todayStart;
  }
  if (dateFilter === 'week') {
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    return created >= weekAgo;
  }
  if (dateFilter === 'month') {
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    return created >= monthAgo;
  }
  if (dateFilter === 'custom') {
    if (!customStartDate) return true;
    const start = new Date(customStartDate);
    const end = customEndDate ? new Date(customEndDate) : new Date();
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return true;
    return created >= start && created <= end;
  }
  return true;
};

const StatusPill = ({ status }) => {
  const style = (() => {
    switch (status) {
      case 'READ':
        return 'bg-indigo-50 text-indigo-700 border-indigo-100';
      case 'UNDER_REVIEW':
        return 'bg-amber-50 text-amber-700 border-amber-100';
      case 'RESOLVED':
        return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'SUBMITTED':
      default:
        return 'bg-sky-50 text-sky-700 border-sky-100';
    }
  })();

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${style}`}>
      {String(status || 'SUBMITTED').replaceAll('_', ' ')}
    </span>
  );
};

const AdminComplaints = () => {
  const [complaints, setComplaints] = useState([]);
  const [selectedComplaintId, setSelectedComplaintId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  // Filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('month');
  const [searchQuery, setSearchQuery] = useState('');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // Sidebar resizing
  const [sidebarWidth, setSidebarWidth] = useState(380);
  const resizingRef = useRef(false);
  const lastClientXRef = useRef(0);

  // Modal
  const [showActionModal, setShowActionModal] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [acknowledgment, setAcknowledgment] = useState('');

  const fetchComplaints = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/admin/complaints');
      if (response?.data?.success) {
        const list = response.data.data?.complaints || [];
        setComplaints(list);
      } else {
        setComplaints([]);
      }
    } catch {
      toast.error('Failed to load complaints');
      setComplaints([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchComplaints();
  }, [fetchComplaints]);

  const filteredComplaints = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return (complaints || [])
      .filter((c) => {
        if (statusFilter !== 'all' && c?.status !== statusFilter) return false;
        return isWithinDateRange({
          createdAt: c?.createdAt,
          dateFilter,
          customStartDate,
          customEndDate,
        });
      })
      .filter((c) => {
        if (!query) return true;
        return (
          (c?.subject || '').toLowerCase().includes(query) ||
          (c?.content || '').toLowerCase().includes(query) ||
          (c?.userId?.name || '').toLowerCase().includes(query) ||
          (c?.userId?.email || '').toLowerCase().includes(query)
        );
      });
  }, [complaints, statusFilter, dateFilter, customStartDate, customEndDate, searchQuery]);

  const selectedComplaint = useMemo(() => {
    if (!selectedComplaintId) return null;
    return (complaints || []).find((c) => c?._id === selectedComplaintId) || null;
  }, [complaints, selectedComplaintId]);

  useEffect(() => {
    if (loading) return;

    // Keep selection stable; fall back to first visible item.
    const stillVisible = filteredComplaints.some((c) => c?._id === selectedComplaintId);
    if (!selectedComplaintId || !stillVisible) {
      setSelectedComplaintId(filteredComplaints[0]?._id || null);
    }
  }, [loading, filteredComplaints, selectedComplaintId]);

  useEffect(() => {
    const onMouseMove = (e) => {
      if (!resizingRef.current) return;
      const dx = e.clientX - lastClientXRef.current;
      lastClientXRef.current = e.clientX;

      setSidebarWidth((prev) => {
        const next = prev + dx;
        const min = 320;
        const max = 560;
        return Math.max(min, Math.min(max, next));
      });
    };

    const onMouseUp = () => {
      if (!resizingRef.current) return;
      resizingRef.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, []);

  const startResize = (e) => {
    e.preventDefault();
    resizingRef.current = true;
    lastClientXRef.current = e.clientX;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };

  const handleUpdateStatus = async () => {
    if (!selectedComplaint?._id || !newStatus) return;

    setUpdating(true);
    try {
      const response = await api.patch(`/api/admin/complaints/${selectedComplaint._id}/status`, {
        status: newStatus,
        acknowledgment: newStatus === 'RESOLVED' ? acknowledgment : undefined,
      });

      if (response?.data?.success) {
        toast.success('Status updated');
        setShowActionModal(false);
        setNewStatus('');
        setAcknowledgment('');
        fetchComplaints();
      } else {
        toast.error('Failed to update status');
      }
      } catch {
      toast.error('Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  const handleDownloadReport = async () => {
    try {
      // Build query params based on current filters
      const params = {};
      
      if (dateFilter === 'today') {
        const today = new Date();
        params.startDate = today.toISOString().split('T')[0];
        params.endDate = today.toISOString().split('T')[0];
      } else if (dateFilter === 'week') {
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        params.startDate = weekAgo.toISOString().split('T')[0];
        params.endDate = new Date().toISOString().split('T')[0];
      } else if (dateFilter === 'month') {
        const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        params.startDate = monthAgo.toISOString().split('T')[0];
        params.endDate = new Date().toISOString().split('T')[0];
      } else if (dateFilter === 'custom' && customStartDate) {
        params.startDate = customStartDate;
        params.endDate = customEndDate || new Date().toISOString().split('T')[0];
      }

      const response = await api.get('/api/admin/reports', {
        params,
        responseType: 'blob'
      });

      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `complaints-report-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      toast.success('Report downloaded successfully');
    } catch (error) {
      toast.error('Failed to download report');
    }
  };

  return (
    <div className="flex h-[calc(100vh-64px-48px)] min-h-[520px]">
      {/* Left Sidebar (Resizable) */}
      <div
        className="relative flex flex-col bg-white border border-gray-200 overflow-x-hidden"
        style={{ width: sidebarWidth }}
      >
        {/* Drag handle */}
        <div
          role="separator"
          aria-orientation="vertical"
          title="Drag to resize"
          onMouseDown={startResize}
          className="absolute right-0 top-0 h-full w-1 cursor-col-resize bg-transparent hover:bg-gray-200"
        />

        {/* Top filters (compact) */}
        <div className="px-3 pt-3 pb-2 border-b border-gray-200">
          {/* Download Report Button */}
          <div className="mb-3">
            <button
              onClick={handleDownloadReport}
              className="w-full inline-flex items-center justify-center px-3 py-2 bg-green-600 text-white text-xs font-medium rounded-md hover:bg-green-700 transition-colors"
            >
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Download Report
            </button>
          </div>
          
          {/* Status tabs row */}
          <div className="flex items-center gap-1 border-b border-gray-100 pb-2">
            {STATUS_TABS.map((tab) => {
              const active = statusFilter === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setStatusFilter(tab.key)}
                  className={
                    "min-w-0 flex-1 text-center text-xs font-medium px-2 py-1 rounded-md transition-colors " +
                    (active
                      ? 'text-blue-700 bg-blue-50'
                      : 'text-gray-600 hover:bg-gray-50')
                  }
                >
                  <span className="block truncate" title={tab.label}>
                    {tab.label}
                  </span>
                  <span
                    className={
                      'mt-1 block h-0.5 w-full rounded-full ' +
                      (active ? 'bg-blue-600' : 'bg-transparent')
                    }
                  />
                </button>
              );
            })}
          </div>

          {/* Date filter row */}
          <div className="mt-2 flex items-center gap-1">
            {DATE_TABS.map((tab) => {
              const active = dateFilter === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setDateFilter(tab.key)}
                  className={
                    "min-w-0 flex-1 rounded-full border px-2 py-1 text-[11px] font-medium transition-colors " +
                    (active
                      ? 'border-blue-200 bg-blue-50 text-blue-700'
                      : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50')
                  }
                >
                  <span className="block truncate" title={tab.label}>
                    {tab.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Custom date controls (kept compact) */}
          {dateFilter === 'custom' && (
            <div className="mt-2 grid grid-cols-2 gap-2">
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="h-8 w-full rounded-md border border-gray-200 px-2 text-xs text-gray-700 focus:border-blue-500 focus:outline-none"
              />
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="h-8 w-full rounded-md border border-gray-200 px-2 text-xs text-gray-700 focus:border-blue-500 focus:outline-none"
              />
            </div>
          )}

          {/* Search row */}
          <div className="mt-2">
            <div className="relative">
              <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-gray-400">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                  <path
                    d="M21 21l-4.2-4.2"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search"
                className="h-8 w-full rounded-md border border-gray-200 bg-white pl-8 pr-2 text-xs text-gray-700 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div className="mt-1 text-[11px] text-gray-500">
              {filteredComplaints.length} result{filteredComplaints.length === 1 ? '' : 's'}
            </div>
          </div>
        </div>

        {/* Complaint list (scrollable; takes remaining height) */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="divide-y divide-gray-100">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="px-3 py-2 animate-pulse">
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2 flex-1">
                      <div className="h-3 bg-gray-200 rounded w-24"></div>
                      <div className="h-3 bg-gray-200 rounded w-16"></div>
                    </div>
                    <div className="h-4 w-16 bg-gray-200 rounded-full"></div>
                  </div>
                  <div className="h-3 bg-gray-200 rounded w-full mb-1"></div>
                  <div className="h-3 bg-gray-200 rounded w-3/4 mb-1.5"></div>
                  <div className="h-2.5 bg-gray-200 rounded w-20"></div>
                </div>
              ))}
            </div>
          ) : filteredComplaints.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-8">
              <svg className="w-16 h-16 text-gray-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-sm font-medium text-gray-700">No complaints found</p>
              <p className="text-xs text-gray-500 mt-1">Try adjusting your filters</p>
            </div>
          ) : (
            filteredComplaints.map((c) => {
              const active = c?._id === selectedComplaintId;
              const name = c?.userId?.name || 'Unknown';
              const subject = (c?.subject || '').replace(/\s+/g, ' ').trim();
              const complaintId = c?.complaintId || c?._id;

              return (
                <button
                  key={c?._id}
                  type="button"
                  onClick={() => setSelectedComplaintId(c?._id)}
                  className={
                    "w-full text-left px-3 py-2 border-b border-gray-100 transition-colors " +
                    (active ? 'bg-blue-50' : 'hover:bg-gray-50')
                  }
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 min-w-0">
                        <p className="text-xs font-semibold text-gray-900 truncate" title={name}>
                          {name}
                        </p>
                        {complaintId ? (
                          <p className="text-[11px] text-gray-500 truncate font-mono" title={complaintId}>
                            {complaintId}
                          </p>
                        ) : null}
                      </div>
                      <p className="mt-0.5 text-[11px] text-gray-600 truncate" title={subject}>
                        {subject || '—'}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <StatusPill status={c?.status} />
                      <span className="text-[11px] text-gray-400 whitespace-nowrap">
                        {formatListDate(c?.createdAt)}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Right Details Panel */}
      <div className="flex-1 min-w-0 bg-white border border-gray-200 border-l-0">
        {loading ? (
          <div className="h-full flex flex-col animate-pulse">
            <div className="px-5 py-4 border-b border-gray-200">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-48"></div>
                </div>
                <div className="h-5 w-20 bg-gray-200 rounded-full"></div>
              </div>
              <div className="mt-3 grid grid-cols-1 md:grid-cols-4 gap-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="rounded-md border border-gray-200 px-3 py-2">
                    <div className="h-2.5 bg-gray-200 rounded w-16 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-24"></div>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-4">
              <div className="space-y-4">
                <div>
                  <div className="h-3 bg-gray-200 rounded w-16 mb-2"></div>
                  <div className="rounded-md border border-gray-200 px-4 py-3">
                    <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  </div>
                </div>
                <div>
                  <div className="h-3 bg-gray-200 rounded w-20 mb-2"></div>
                  <div className="rounded-md border border-gray-200 px-4 py-3">
                    <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : !selectedComplaint ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <p className="text-sm font-medium text-gray-800">Select a complaint</p>
              <p className="mt-1 text-xs text-gray-500">Details will appear here.</p>
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col">
            <div className="px-5 py-4 border-b border-gray-200">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900">Complaint Details</p>
                  <p className="mt-1 text-xs text-gray-500">
                    Submitted {new Date(selectedComplaint.createdAt).toLocaleString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
                <StatusPill status={selectedComplaint.status} />
              </div>

              <div className="mt-3 grid grid-cols-1 md:grid-cols-4 gap-3">
                <div className="rounded-md border border-gray-200 px-3 py-2">
                  <p className="text-[11px] text-gray-500">Student ID</p>
                  <p className="text-sm text-gray-900 break-words font-mono">{selectedComplaint.userId?.studentId || '—'}</p>
                </div>
                <div className="rounded-md border border-gray-200 px-3 py-2">
                  <p className="text-[11px] text-gray-500">Student Name</p>
                  <p className="text-sm text-gray-900 break-words">{selectedComplaint.userId?.name || '—'}</p>
                </div>
                <div className="rounded-md border border-gray-200 px-3 py-2">
                  <p className="text-[11px] text-gray-500">Email</p>
                  <p className="text-sm text-gray-900 break-words">{selectedComplaint.userId?.email || '—'}</p>
                </div>
                <div className="rounded-md border border-gray-200 px-3 py-2">
                  <p className="text-[11px] text-gray-500">Complaint ID</p>
                  <p className="text-sm text-gray-900 break-words font-mono">{selectedComplaint.complaintId || selectedComplaint._id}</p>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4">
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-semibold text-gray-700">Subject</p>
                  <div className="mt-2 rounded-md border border-gray-200 bg-white px-4 py-3">
                    <p className="text-sm text-gray-900 whitespace-pre-wrap break-words">
                      {selectedComplaint.subject || '—'}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-xs font-semibold text-gray-700">Complaint</p>
                  <div className="mt-2 rounded-md border border-gray-200 bg-gray-50 px-4 py-3">
                    <p className="text-sm text-gray-900 whitespace-pre-wrap break-words">
                      {selectedComplaint.content || '—'}
                    </p>
                  </div>
                </div>

                {selectedComplaint.acknowledgment ? (
                  <div>
                    <p className="text-xs font-semibold text-gray-700">Admin Response</p>
                    <div className="mt-2 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3">
                      <p className="text-sm text-emerald-900 whitespace-pre-wrap break-words">
                        {selectedComplaint.acknowledgment}
                      </p>
                    </div>
                  </div>
                ) : null}

                {/* Rating Display */}
                {selectedComplaint.rating && (
                  <div>
                    <p className="text-xs font-semibold text-gray-700">Resolution Rating</p>
                    <div className="mt-2 rounded-md border border-amber-200 bg-amber-50 px-4 py-3">
                      <div className="flex items-center gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <svg
                            key={star}
                            className={`w-5 h-5 ${
                              star <= selectedComplaint.rating
                                ? 'text-amber-500 fill-amber-500'
                                : 'text-gray-300 fill-gray-300'
                            }`}
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                        <span className="text-sm font-medium text-amber-900 ml-2">
                          {selectedComplaint.rating} out of 5 stars
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Acknowledgment Display */}
                {selectedComplaint.acknowledgedByStudent && (
                  <div>
                    <p className="text-xs font-semibold text-gray-700">Student Acknowledgment</p>
                    <div className="mt-2 rounded-md border border-green-200 bg-green-50 px-4 py-3">
                      <div className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-sm font-medium text-green-900">
                          Acknowledged on {new Date(selectedComplaint.acknowledgedAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {selectedComplaint.acknowledgedByEmployee && (
                  <div>
                    <p className="text-xs font-semibold text-gray-700">Employee Acknowledgment</p>
                    <div className="mt-2 rounded-md border border-teal-200 bg-teal-50 px-4 py-3">
                      <div className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-sm font-medium text-teal-900">
                          Acknowledged on {new Date(selectedComplaint.acknowledgedAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Reopen History */}
                {selectedComplaint.reopenHistory && selectedComplaint.reopenHistory.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-700">Reopen History</p>
                    <div className="mt-2 space-y-2">
                      {selectedComplaint.reopenHistory.map((reopen, index) => (
                        <div key={index} className="rounded-md border border-orange-200 bg-orange-50 px-4 py-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="text-xs text-orange-700 font-medium">
                                Reopened on {new Date(reopen.reopenedAt).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </p>
                              <p className="text-xs text-orange-600 mt-1">
                                Previous Status: <span className="font-medium">{reopen.previousStatus}</span>
                              </p>
                              <p className="text-sm text-orange-900 mt-2 whitespace-pre-wrap break-words">
                                {reopen.reopenRemarks}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="px-5 py-4 border-t border-gray-200">
              {(() => {
                const isResolved = selectedComplaint.status === 'RESOLVED';
                return (
              <button
                type="button"
                onClick={() => {
                  if (isResolved) return;
                  setShowActionModal(true);
                  setNewStatus(selectedComplaint.status || 'SUBMITTED');
                }}
                disabled={isResolved}
                className="h-9 w-full rounded-md border border-blue-600 bg-blue-600 text-sm font-semibold text-white hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Update Status
              </button>
                );
              })()}
            </div>
          </div>
        )}
      </div>

      {/* Status Update Modal (light overlay) */}
      {showActionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/20 px-4">
          <div className="w-full max-w-lg rounded-lg border border-gray-200 bg-white">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
              <p className="text-sm font-semibold text-gray-900">Update Status</p>
              <button
                type="button"
                onClick={() => setShowActionModal(false)}
                className="h-8 w-8 rounded-md hover:bg-gray-50 text-gray-500"
                aria-label="Close"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  <path d="M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            <div className="px-5 py-4 space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="h-9 w-full rounded-md border border-gray-200 px-2 text-sm text-gray-800 focus:border-blue-500 focus:outline-none"
                >
                  <option value="SUBMITTED">Submitted</option>
                  <option value="READ">Read</option>
                  <option value="UNDER_REVIEW">Under Review</option>
                  <option value="RESOLVED">Resolved</option>
                </select>
              </div>

              {newStatus === 'RESOLVED' && (
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Response <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={acknowledgment}
                    onChange={(e) => setAcknowledgment(e.target.value)}
                    rows={4}
                    className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-800 focus:border-blue-500 focus:outline-none"
                    placeholder="Write a short response (required)…"
                  />
                  {!acknowledgment.trim() && (
                    <p className="mt-1 text-xs text-red-500">Response is required to resolve complaint</p>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 px-5 py-4 border-t border-gray-200">
              <button
                type="button"
                onClick={() => setShowActionModal(false)}
                className="h-9 flex-1 rounded-md border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUpdateStatus}
                disabled={updating || (newStatus === 'RESOLVED' && !acknowledgment.trim())}
                className="h-9 flex-1 rounded-md border border-blue-600 bg-blue-600 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {updating ? 'Updating…' : 'Update'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminComplaints;
