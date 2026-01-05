import { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { FiSearch } from 'react-icons/fi';

const AdminStudents = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ current: 1, pages: 1, total: 0 });
  const [search, setSearch] = useState('');

  const fetchStudents = useCallback(async (page = 1, searchTerm = '') => {
    setLoading(true);
    try {
      const response = await api.get('/api/admin/students', {
        params: { page, limit: 10, search: searchTerm },
      });

      if (response.data.success) {
        setStudents(response.data.data.students);
        setPagination(response.data.data.pagination);
      }
    } catch (error) {
      toast.error('Failed to fetch students');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchStudents(1, search);
  };

  const handlePageChange = (page) => {
    fetchStudents(page, search);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-sm font-semibold text-gray-900">Student Database</h1>
        <p className="mt-1 text-xs text-gray-500">All registered students</p>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex items-center gap-2">
        <div className="relative flex-1 max-w-xl">
          <FiSearch className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, email, college"
            className="h-9 w-full rounded-md border border-gray-200 bg-white pl-8 pr-3 text-sm text-gray-800 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none"
          />
        </div>
        <button
          type="submit"
          className="h-9 rounded-md border border-gray-200 bg-white px-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Search
        </button>
      </form>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-[11px] font-semibold text-gray-600">Student Name</th>
                <th className="px-4 py-2 text-left text-[11px] font-semibold text-gray-600">Gmail</th>
                <th className="px-4 py-2 text-left text-[11px] font-semibold text-gray-600">Student ID</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={3} className="px-4 py-10 text-center text-sm text-gray-500">
                    Loading…
                  </td>
                </tr>
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-4 py-10 text-center">
                    <p className="text-sm text-gray-600">No students found</p>
                  </td>
                </tr>
              ) : (
                students.map((student) => (
                  <tr key={student._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 align-top">
                      <p className="text-sm font-medium text-gray-900 break-words">{student.name}</p>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <p className="text-sm text-gray-700 break-words">{student.email}</p>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <p className="text-sm text-gray-700 font-mono" title={student.studentId}>
                        {student.studentId || '—'}
                      </p>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-between gap-3 px-4 py-3 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              Page {pagination.current} of {pagination.pages} · {pagination.total} total
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handlePageChange(pagination.current - 1)}
                disabled={pagination.current === 1}
                className="h-8 rounded-md border border-gray-200 bg-white px-3 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                type="button"
                onClick={() => handlePageChange(pagination.current + 1)}
                disabled={pagination.current === pagination.pages}
                className="h-8 rounded-md border border-gray-200 bg-white px-3 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminStudents;
