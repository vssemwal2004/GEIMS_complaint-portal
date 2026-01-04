import { useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { FiPlusCircle } from 'react-icons/fi';

const StudentDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [recentComplaints, setRecentComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [barsReady, setBarsReady] = useState(false);

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

  useEffect(() => {
    const id = setTimeout(() => setBarsReady(true), 50);
    return () => clearTimeout(id);
  }, []);

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

  const totals = useMemo(() => {
    const totalComplaints = stats?.totalComplaints || 0;
    const read = stats?.byStatus?.read || 0;
    const underReview = stats?.byStatus?.underReview || 0;
    const resolved = stats?.byStatus?.resolved || 0;
    return { totalComplaints, read, underReview, resolved };
  }, [stats]);

  const hasStats = !!stats;

  const activity = useMemo(() => {
    const mostRecentCreatedAt = recentComplaints.reduce((latest, complaint) => {
      const createdAt = complaint?.createdAt ? new Date(complaint.createdAt) : null;
      if (!createdAt || Number.isNaN(createdAt.getTime())) return latest;
      if (!latest) return createdAt;
      return createdAt > latest ? createdAt : latest;
    }, null);

    const mostRecentResolvedAt = recentComplaints.reduce((latest, complaint) => {
      const resolvedAt = complaint?.resolvedAt ? new Date(complaint.resolvedAt) : null;
      if (!resolvedAt || Number.isNaN(resolvedAt.getTime())) return latest;
      if (!latest) return resolvedAt;
      return resolvedAt > latest ? resolvedAt : latest;
    }, null);

    const recentStatusCounts = recentComplaints.reduce(
      (acc, complaint) => {
        const status = complaint?.status;
        if (status === 'READ') acc.READ += 1;
        if (status === 'UNDER_REVIEW') acc.UNDER_REVIEW += 1;
        if (status === 'RESOLVED') acc.RESOLVED += 1;
        return acc;
      },
      { READ: 0, UNDER_REVIEW: 0, RESOLVED: 0 }
    );

    return { mostRecentCreatedAt, mostRecentResolvedAt, recentStatusCounts };
  }, [recentComplaints]);

  const distribution = useMemo(() => {
    const total = totals.totalComplaints || 0;
    const safePct = (value) => {
      if (!total) return 0;
      return Math.round((value / total) * 100);
    };
    return {
      readPct: safePct(totals.read),
      underReviewPct: safePct(totals.underReview),
      resolvedPct: safePct(totals.resolved),
    };
  }, [totals]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-primary-50/40 border border-primary-100 rounded-xl px-4 py-4">
        <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold leading-tight text-gray-900 flex items-baseline gap-2">
            <span className="inline-flex items-baseline gap-2">
              <span className="welcome-word welcome-word-0">Welcome</span>
              <span className="welcome-word welcome-word-1">back</span>
            </span>
            <span className="text-primary-700 truncate">{user?.name}</span>
          </h1>
          <p className="text-sm text-gray-700 mt-1">Complaint dashboard summary</p>
        </div>
        <Link
          href="/student/submit"
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:opacity-90"
        >
          <FiPlusCircle size={16} />
          Submit
        </Link>
        </div>
        <div className="h-px bg-primary-100 mt-4" />
      </div>

      {/* Stats Cards (single row on all breakpoints) */}
      <div className="grid grid-cols-4 gap-2">
        {[
          {
            label: 'Total',
            value: totals.totalComplaints,
            bg: 'bg-primary-50/40',
            accent: 'border-primary-400',
          },
          { label: 'Read', value: totals.read, bg: 'bg-blue-50', accent: 'border-blue-500' },
          {
            label: 'Under Review',
            value: totals.underReview,
            bg: 'bg-yellow-50',
            accent: 'border-yellow-500',
          },
          { label: 'Resolved', value: totals.resolved, bg: 'bg-green-50', accent: 'border-green-600' },
        ].map((item) => (
          <div
            key={item.label}
            className={`min-w-0 border border-gray-200 rounded-xl px-2.5 py-3 sm:px-4 sm:py-4 shadow-sm ${item.bg} border-t-4 ${item.accent}`}
          >
            <p className="text-[11px] sm:text-xs text-gray-700 truncate" title={item.label}>
              {item.label}
            </p>
            <p className="text-lg sm:text-2xl font-bold text-gray-900 mt-1 leading-none">
              {hasStats ? item.value : '—'}
            </p>
          </div>
        ))}
      </div>

      {/* Complaint Overview / Activity Summary (complaint-only) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-primary-50/30 border border-gray-200 rounded-xl">
          <div className="px-4 py-3 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-900">Activity Summary</h2>
            <p className="text-xs text-gray-600 mt-0.5">Based on your most recent complaints</p>
          </div>
          <div className="px-4 py-4 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="min-w-0">
                <p className="text-xs text-gray-500">Last submitted</p>
                <p className="text-sm text-gray-900 mt-1 truncate">
                  {activity.mostRecentCreatedAt
                    ? activity.mostRecentCreatedAt.toLocaleString()
                    : '—'}
                </p>
              </div>
              <div className="min-w-0">
                <p className="text-xs text-gray-500">Last resolved</p>
                <p className="text-sm text-gray-900 mt-1 truncate">
                  {activity.mostRecentResolvedAt
                    ? activity.mostRecentResolvedAt.toLocaleString()
                    : '—'}
                </p>
              </div>
            </div>

            <div>
              <p className="text-xs text-gray-500">Recent statuses (last {recentComplaints.length})</p>
              <div className="flex flex-wrap gap-2 mt-2">
                <span className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                  Read: {activity.recentStatusCounts.READ}
                </span>
                <span className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-50 text-yellow-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-yellow-600" />
                  Under Review: {activity.recentStatusCounts.UNDER_REVIEW}
                </span>
                <span className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-600" />
                  Resolved: {activity.recentStatusCounts.RESOLVED}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl">
          <div className="px-4 py-3 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-900">Complaint Overview</h2>
            <p className="text-xs text-gray-600 mt-0.5">Overall status distribution</p>
          </div>
          <div className="px-4 py-4 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-700">Read</p>
              <p className="text-sm text-gray-900 font-medium">
                {hasStats ? totals.read : '—'} ({distribution.readPct}%)
              </p>
            </div>
            <div className="h-2 rounded-full bg-blue-100 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-[width] duration-700 ease-out"
                style={{ width: `${barsReady ? distribution.readPct : 0}%` }}
              />
            </div>

            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-700">Under Review</p>
              <p className="text-sm text-gray-900 font-medium">
                {hasStats ? totals.underReview : '—'} ({distribution.underReviewPct}%)
              </p>
            </div>
            <div className="h-2 rounded-full bg-yellow-100 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-yellow-500 to-yellow-600 transition-[width] duration-700 ease-out"
                style={{ width: `${barsReady ? distribution.underReviewPct : 0}%` }}
              />
            </div>

            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-700">Resolved</p>
              <p className="text-sm text-gray-900 font-medium">
                {hasStats ? totals.resolved : '—'} ({distribution.resolvedPct}%)
              </p>
            </div>
            <div className="h-2 rounded-full bg-green-100 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-green-500 to-green-600 transition-[width] duration-700 ease-out"
                style={{ width: `${barsReady ? distribution.resolvedPct : 0}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Recent Complaints */}
      <div className="bg-white border border-gray-200 rounded-xl">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">Recent Complaints</h2>
            <p className="text-xs text-gray-600 mt-0.5">Latest submissions and their current status</p>
          </div>
          <Link href="/student/complaints" className="text-sm text-gray-600 hover:text-primary-800 font-medium">
            View all
          </Link>
        </div>

        {recentComplaints.length === 0 ? (
          <div className="px-4 py-8">
            <div className="border border-dashed border-gray-200 rounded-lg bg-gray-50 px-4 py-6 text-center">
              <p className="text-sm text-gray-700">No complaints yet.</p>
              <p className="text-xs text-gray-500 mt-1">Submit a complaint to see updates and activity here.</p>
            </div>
          </div>
        ) : (
          <>
            <div className="md:hidden divide-y divide-gray-100">
              {recentComplaints.map((complaint) => (
                <div key={complaint._id} className="px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm text-gray-900 line-clamp-1">{complaint.content}</p>
                    <StatusBadge status={complaint.status} />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(complaint.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </p>
                </div>
              ))}
            </div>

            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="text-xs text-gray-500">
                  <tr className="border-b border-gray-100">
                    <th className="text-left font-medium px-4 py-2">Date</th>
                    <th className="text-left font-medium px-4 py-2">Status</th>
                    <th className="text-left font-medium px-4 py-2">Complaint</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {recentComplaints.map((complaint) => (
                    <tr key={complaint._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                        {new Date(complaint.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <StatusBadge status={complaint.status} />
                      </td>
                      <td className="px-4 py-3 text-gray-900">
                        <span className="line-clamp-1">{complaint.content}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      <style jsx>{`
        .welcome-word {
          display: inline-block;
          opacity: 0;
          transform: translateX(-8px);
          animation: welcomeReveal 5s ease-in-out infinite;
          will-change: opacity, transform;
        }

        .welcome-word-0 {
          animation-delay: 0s;
        }

        .welcome-word-1 {
          animation-delay: 0.25s;
        }

        @keyframes welcomeReveal {
          0% {
            opacity: 0;
            transform: translateX(-8px);
          }
          12% {
            opacity: 1;
            transform: translateX(0);
          }
          88% {
            opacity: 1;
            transform: translateX(0);
          }
          100% {
            opacity: 0;
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
  );
};

export default StudentDashboard;
