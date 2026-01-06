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
    } catch (error) {
      console.error('Failed to fetch complaints:', error);
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
    } catch (error) {
      console.error('Failed to update status:', error);
      toast.error('Failed to update status');
    } finally {
      setUpdating(false);
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
            <div className="px-3 py-4 text-xs text-gray-500">Loading…</div>
          ) : filteredComplaints.length === 0 ? (
            <div className="px-3 py-4 text-xs text-gray-500">No complaints found.</div>
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
        {!selectedComplaint ? (
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
