import { useState } from 'react';
import toast from 'react-hot-toast';
import { FiX, FiAlertCircle } from 'react-icons/fi';

const ReopenComplaintModal = ({ onClose, onReopen }) => {
  const [reopenRemarks, setReopenRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!reopenRemarks.trim() || reopenRemarks.trim().length < 10) {
      toast.error('Please provide at least 10 characters explaining why you want to reopen this complaint');
      return;
    }

    try {
      setSubmitting(true);
      await onReopen(reopenRemarks);
      setReopenRemarks('');
    } catch (error) {
      // Error already handled by parent
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative flex items-center justify-center min-h-full p-4">
        <div className="w-full max-w-lg bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-orange-100">
                <svg className="w-5 h-5 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
              <h3 className="text-sm font-semibold text-gray-900">Reopen Complaint</h3>
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="w-9 h-9 inline-flex items-center justify-center rounded-lg hover:bg-gray-50 text-gray-600"
              aria-label="Close"
            >
              <FiX size={18} />
            </button>
          </div>

          {/* Body */}
          <form onSubmit={handleSubmit}>
            <div className="px-4 py-4 space-y-4">
              <div className="rounded-lg border border-orange-200 bg-orange-50 px-3 py-3">
                <div className="flex items-start gap-2">
                  <FiAlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-orange-900">
                    Please explain why you need to reopen this complaint. Your remarks will be visible to the admin/sub-admin.
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-800 mb-2">
                  Reason for Reopening <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={reopenRemarks}
                  onChange={(e) => setReopenRemarks(e.target.value)}
                  rows={5}
                  maxLength={2000}
                  className={`w-full px-3 py-3 border rounded-lg bg-white resize-none focus:outline-none focus:ring-2 focus:ring-orange-500 placeholder:text-gray-400 ${
                    reopenRemarks.trim().length > 0 && reopenRemarks.trim().length < 10
                      ? 'border-red-500'
                      : 'border-gray-200'
                  }`}
                  placeholder="Explain why you're reopening this complaint..."
                  disabled={submitting}
                />
                <div className="flex items-center justify-between mt-2">
                  <p className={`text-xs ${
                    reopenRemarks.trim().length > 0 && reopenRemarks.trim().length < 10
                      ? 'text-red-600'
                      : 'text-gray-500'
                  }`}>
                    {reopenRemarks.trim().length > 0 && reopenRemarks.trim().length < 10 
                      ? 'Minimum 10 characters required' 
                      : 'Minimum 10 characters'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {reopenRemarks.length}/2000
                  </p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-4 py-3 border-t border-gray-100 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="w-full sm:w-auto px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || reopenRemarks.trim().length < 10}
                className="w-full sm:w-auto px-4 py-2 bg-orange-600 text-white text-sm font-medium rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Reopening...
                  </span>
                ) : (
                  'Reopen Complaint'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ReopenComplaintModal;
