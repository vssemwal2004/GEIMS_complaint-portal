import { useState } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';

const FileUpload = () => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [sending, setSending] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (selectedFile) => {
    const allowedTypes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];

    if (!allowedTypes.includes(selectedFile.type)) {
      toast.error('Please upload a CSV or Excel file');
      return;
    }

    setFile(selectedFile);
  };

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileChange(e.target.files[0]);
    }
  };

  const validateFile = async () => {
    if (!file) {
      toast.error('Please select a file first');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await api.post('/api/attendance/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      toast.success(`File validated! Found ${response.data.recordCount} records`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'File validation failed');
    } finally {
      setUploading(false);
    }
  };

  const sendReports = async () => {
    if (!file) {
      toast.error('Please select a file first');
      return;
    }

    setSending(true);
    const toastId = toast.loading('Sending reports...');
    
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await api.post('/api/attendance/send-reports', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      toast.success('Reports sent successfully!', { id: toastId });
      
      // Show detailed results
      const details = response.data.details;
      if (details?.conditions) {
        setTimeout(() => {
          const completed = details.conditions.filter(c => c.status === 'COMPLETED');
          toast.success(`Successfully sent ${completed.length} report groups`, { duration: 5000 });
        }, 500);
      }
      
      setFile(null);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send reports', { id: toastId });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Upload Attendance File</h2>
      
      <div className="space-y-6">
        {/* File Upload Area */}
        <div
          className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragActive 
              ? 'border-indigo-500 bg-indigo-50' 
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            type="file"
            id="file-upload"
            className="hidden"
            accept=".csv,.xlsx,.xls"
            onChange={handleFileInput}
          />
          
          <div className="space-y-4">
            <div className="flex justify-center">
              <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            
            {file ? (
              <div className="space-y-2">
                <p className="text-lg font-semibold text-green-600">
                  ✓ {file.name}
                </p>
                <p className="text-sm text-gray-500">
                  {(file.size / 1024).toFixed(2)} KB
                </p>
                <button
                  onClick={() => setFile(null)}
                  className="text-sm text-red-600 hover:text-red-700 font-medium"
                >
                  Remove file
                </button>
              </div>
            ) : (
              <>
                <div>
                  <label
                    htmlFor="file-upload"
                    className="cursor-pointer inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                  >
                    Choose File
                  </label>
                </div>
                <p className="text-sm text-gray-600">
                  or drag and drop
                </p>
                <p className="text-xs text-gray-500">
                  CSV or XLSX files only (Max 10MB)
                </p>
              </>
            )}
          </div>
        </div>

        {/* File Requirements */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-blue-900 mb-2">Required File Structure:</h3>
          <ul className="text-xs text-blue-800 space-y-1">
            <li>• S.No</li>
            <li>• Attendance id</li>
            <li>• User Name</li>
            <li>• Users Designation</li>
            <li>• Office Locations</li>
            <li>• Division/Units</li>
            <li>• In Time</li>
            <li>• Out Time</li>
            <li>• Status</li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <button
            onClick={validateFile}
            disabled={!file || uploading}
            className="flex-1 bg-gray-600 text-white py-3 px-6 rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {uploading ? 'Validating...' : 'Validate File'}
          </button>
          
          <button
            onClick={sendReports}
            disabled={!file || sending}
            className="flex-1 bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {sending ? 'Sending...' : 'Send Reports'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FileUpload;
