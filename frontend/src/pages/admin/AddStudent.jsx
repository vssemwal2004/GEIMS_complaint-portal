import { useState } from 'react';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';
import api from '../../services/api';

const AddStudent = () => {
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    college: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  // CSV upload (keeps existing endpoint + behavior)
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [results, setResults] = useState(null);

  const onChange = (key) => (e) => {
    setFormData((prev) => ({ ...prev, [key]: e.target.value }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setSubmitting(true);

    try {
      const payload = {
        name: formData.name,
        email: formData.email,
        college: formData.college,
      };

      const response = await api.post('/api/admin/students', payload);
      if (response?.data?.success) {
        toast.success('Student created. Credentials sent via email.');
        setFormData({ name: '', email: '', college: '' });
        return;
      }

      toast.error(response?.data?.message || 'Failed to create student');
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Failed to create student';
      const validationErrors = error.response?.data?.errors;

      if (validationErrors) {
        const errObj = {};
        validationErrors.forEach((err) => {
          errObj[err.field] = err.message;
        });
        setErrors(errObj);
      }

      toast.error(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === 'text/csv') {
      setFile(selectedFile);
      setResults(null);
    } else {
      toast.error('Please select a valid CSV file');
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      toast.error('Please select a CSV file');
      return;
    }

    setUploading(true);
    const form = new FormData();
    form.append('file', file);

    try {
      const response = await api.post('/api/admin/students/csv', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (response.data.success) {
        setResults(response.data.data);
        toast.success(response.data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to upload CSV');
    } finally {
      setUploading(false);
    }
  };

  const downloadTemplate = () => {
    const csvContent =
      'name,email,college\nJohn Doe,john@example.com,Sample College\nJane Smith,jane@example.com,Another College';
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'student_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="mx-auto w-full max-w-2xl">
      <div className="text-center">
        <h1 className="text-base font-semibold text-gray-900">Add Student</h1>
        <p className="mt-1 text-xs text-gray-500">Create students manually or upload via CSV</p>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4">
        {/* Manual student entry */}
        <form onSubmit={onSubmit} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-200">
            <p className="text-xs font-semibold text-gray-700">Manual Student Entry</p>
            <p className="mt-1 text-[11px] text-gray-500">
              A temporary password will be generated and sent to the student’s email.
            </p>
          </div>

          <div className="px-5 py-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-gray-700 mb-1">Student Name</label>
                <input
                  value={formData.name}
                  onChange={onChange('name')}
                  required
                  className={
                    "h-9 w-full rounded-md border px-3 text-sm text-gray-800 focus:outline-none " +
                    (errors.name ? 'border-rose-300 focus:border-rose-400' : 'border-gray-200 focus:border-blue-500')
                  }
                  placeholder="Full name"
                />
                {errors.name ? <p className="mt-1 text-[11px] text-rose-600">{errors.name}</p> : null}
              </div>
              <div>
                <label className="block text-[11px] font-medium text-gray-700 mb-1">Gmail</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={onChange('email')}
                  required
                  className={
                    "h-9 w-full rounded-md border px-3 text-sm text-gray-800 focus:outline-none " +
                    (errors.email ? 'border-rose-300 focus:border-rose-400' : 'border-gray-200 focus:border-blue-500')
                  }
                  placeholder="student@gmail.com"
                />
                {errors.email ? <p className="mt-1 text-[11px] text-rose-600">{errors.email}</p> : null}
              </div>
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-medium text-gray-700 mb-1">College</label>
                <input
                  value={formData.college}
                  onChange={onChange('college')}
                  required
                  className={
                    "h-9 w-full rounded-md border px-3 text-sm text-gray-800 focus:outline-none " +
                    (errors.college
                      ? 'border-rose-300 focus:border-rose-400'
                      : 'border-gray-200 focus:border-blue-500')
                  }
                  placeholder="College name"
                />
                {errors.college ? <p className="mt-1 text-[11px] text-rose-600">{errors.college}</p> : null}
              </div>
            </div>
          </div>

          <div className="px-5 py-4 border-t border-gray-200 bg-white">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => router.push('/admin/students')}
                className="h-9 rounded-md border border-gray-200 bg-white px-4 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="h-9 rounded-md border border-blue-600 bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {submitting ? 'Creating…' : 'Create Student'}
              </button>
            </div>
          </div>
        </form>

        {/* CSV upload (existing feature) */}
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-200">
            <p className="text-xs font-semibold text-gray-700">Upload CSV of Students</p>
            <p className="mt-1 text-[11px] text-gray-500">Headers: name, email, college</p>
          </div>

          {!results ? (
            <form onSubmit={handleUpload} className="px-5 py-4 space-y-3">
              <div className="rounded-lg border border-dashed border-gray-200 bg-white p-4">
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="hidden"
                  id="csv-upload"
                />
                <label
                  htmlFor="csv-upload"
                  className="inline-flex items-center justify-center h-9 px-4 rounded-md border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer"
                >
                  Choose CSV File
                </label>

                <div className="mt-2 text-xs text-gray-600 break-words">
                  {file ? `Selected: ${file.name}` : 'No file selected'}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={downloadTemplate}
                  className="h-9 rounded-md border border-gray-200 bg-white px-4 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Download template
                </button>
                <button
                  type="submit"
                  disabled={!file || uploading}
                  className="h-9 rounded-md border border-blue-600 bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {uploading ? 'Uploading…' : 'Upload CSV'}
                </button>
              </div>
            </form>
          ) : (
            <div className="px-5 py-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-center">
                  <p className="text-2xl font-semibold text-emerald-700">{results.created}</p>
                  <p className="text-xs text-emerald-700">Created</p>
                </div>
                <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-center">
                  <p className="text-2xl font-semibold text-rose-700">{results.failed}</p>
                  <p className="text-xs text-rose-700">Failed</p>
                </div>
              </div>

              {results.details?.failed?.length > 0 ? (
                <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 max-h-56 overflow-y-auto">
                  <p className="text-xs font-semibold text-rose-700">Failed Records</p>
                  <ul className="mt-2 text-xs text-rose-700 space-y-1">
                    {results.details.failed.map((item, idx) => (
                      <li key={idx} className="break-words">
                        Row {item.row}: {item.email} - {item.reason}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              <button
                type="button"
                onClick={() => {
                  setResults(null);
                  setFile(null);
                }}
                className="h-9 w-full rounded-md border border-gray-200 bg-white px-4 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddStudent;
