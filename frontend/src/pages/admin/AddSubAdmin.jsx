import { useState } from 'react';
import { useRouter } from 'next/router';
import api from '../../services/api';
import toast from 'react-hot-toast';

const AddSubAdmin = () => {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    department: ''
  });
  const [csvFile, setCSVFile] = useState(null);
  const [uploadMode, setUploadMode] = useState('single');
  const [submitting, setSubmitting] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleFileChange = (e) => {
    setCSVFile(e.target.files[0]);
    setUploadResult(null);
  };

  const downloadTemplate = () => {
    const csvContent = 'name,email,department\nJohn Doe,john@example.com,Computer Science\nJane Smith,jane@example.com,Information Technology';
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sub-admin-template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    toast.success('Template downloaded!');
  };

  const handleSingleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.department) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      setSubmitting(true);
      const response = await api.post('/api/admin/sub-admins', formData);
      
      if (response.data.success) {
        toast.success('Sub-admin created successfully!');
        setFormData({ name: '', email: '', department: '' });
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create sub-admin');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCSVSubmit = async (e) => {
    e.preventDefault();
    
    if (!csvFile) {
      toast.error('Please select a CSV file');
      return;
    }

    try {
      setSubmitting(true);
      const formDataObj = new FormData();
      formDataObj.append('file', csvFile);

      const response = await api.post('/api/admin/sub-admins/csv', formDataObj, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      if (response.data.success) {
        setUploadResult(response.data.data);
        toast.success(response.data.message);
        setCSVFile(null);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to upload CSV');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Add Sub-Admin</h1>
        <p className="text-sm text-gray-600 mt-0.5">Create new sub-admin accounts individually or in bulk</p>
      </div>

      {/* Mode Toggle */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <button
              onClick={() => { setUploadMode('single'); setUploadResult(null); }}
              className={`flex-1 py-3 px-4 text-center text-sm font-medium border-b-2 transition-colors ${
                uploadMode === 'single'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Single Sub-Admin
            </button>
            <button
              onClick={() => { setUploadMode('csv'); setUploadResult(null); }}
              className={`flex-1 py-3 px-4 text-center text-sm font-medium border-b-2 transition-colors ${
                uploadMode === 'csv'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Bulk Upload (CSV)
            </button>
          </nav>
        </div>

        {uploadMode === 'single' ? (
          <form onSubmit={handleSingleSubmit} className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter full name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="email@example.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Department <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  placeholder="e.g., Computer Science"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  required
                />
              </div>
            </div>

            <div className="flex items-start gap-2 p-3 bg-indigo-50 rounded-lg border border-indigo-200">
              <svg className="w-5 h-5 text-indigo-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-indigo-700">
                A temporary password will be generated and sent to the sub-admin's email address.
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => router.push('/admin/sub-admins')}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {submitting ? 'Creating...' : 'Create Sub-Admin'}
              </button>
            </div>
          </form>
        ) : (
          <div className="p-6 space-y-4">
            <form onSubmit={handleCSVSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload CSV File <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center justify-center w-full">
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <svg className="w-8 h-8 mb-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <p className="mb-1 text-sm text-gray-600">
                        <span className="font-semibold">Click to upload</span> or drag and drop
                      </p>
                      <p className="text-xs text-gray-500">CSV files only</p>
                    </div>
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                </div>
                {csvFile && (
                  <div className="mt-2 flex items-center gap-2 text-sm text-gray-600">
                    <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="font-medium">{csvFile.name}</span>
                  </div>
                )}
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={downloadTemplate}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Download Template
                </button>
                <button
                  type="submit"
                  disabled={!csvFile || submitting}
                  className="w-full px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {submitting ? 'Uploading...' : 'Upload CSV'}
                </button>
              </div>
            </form>

            <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-3">
              <div className="flex gap-2">
                <svg className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="text-sm text-yellow-700">
                  <p className="font-medium mb-1">CSV Format Requirements:</p>
                  <ul className="list-disc list-inside space-y-0.5 text-xs">
                    <li>Required columns: name, email, department</li>
                    <li>First row must be headers</li>
                    <li>Use commas to separate values</li>
                  </ul>
                </div>
              </div>
            </div>

            {uploadResult && (
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-blue-600">{uploadResult.totalProcessed}</div>
                    <div className="text-xs text-blue-700 font-medium">Total</div>
                  </div>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-green-600">{uploadResult.created}</div>
                    <div className="text-xs text-green-700 font-medium">Created</div>
                  </div>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-red-600">{uploadResult.failed}</div>
                    <div className="text-xs text-red-700 font-medium">Failed</div>
                  </div>
                </div>

                {uploadResult.details?.failed?.length > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 max-h-48 overflow-y-auto">
                    <p className="text-sm font-medium text-red-700 mb-2">Failed Records:</p>
                    <ul className="text-xs text-red-600 space-y-1">
                      {uploadResult.details.failed.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="font-medium">Row {item.row}:</span>
                          <span>{item.email} - {item.reason}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AddSubAdmin;
