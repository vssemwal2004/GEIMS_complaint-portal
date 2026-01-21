import { useState } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const SubAdminReports = () => {
  const [reportType, setReportType] = useState('last7days');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [generating, setGenerating] = useState(false);

  const handleGenerateReport = async () => {
    try {
      setGenerating(true);

      const params = {};
      if (reportType === 'custom') {
        if (!startDate || !endDate) {
          toast.error('Please select both start and end dates');
          return;
        }
        params.startDate = startDate;
        params.endDate = endDate;
        params.predefinedRange = 'custom';
      } else {
        params.predefinedRange = reportType;
      }

      const response = await api.get('/api/sub-admin/reports', {
        params,
        responseType: 'blob'
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `department-complaints-report-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();

      toast.success('Report downloaded successfully');
    } catch (error) {
      toast.error('Failed to generate report');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Generate Reports</h1>
        <p className="mt-2 text-sm text-gray-600">Download complaint reports for your department</p>
      </div>

      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Select Report Parameters
          </h3>

          <div className="space-y-6">
            {/* Report Type Selection */}
            <div>
              <label className="text-base font-medium text-gray-900">Report Period</label>
              <p className="text-sm leading-5 text-gray-500">Choose the time range for the report</p>
              <fieldset className="mt-4">
                <legend className="sr-only">Report type</legend>
                <div className="space-y-4">
                  <div className="flex items-center">
                    <input
                      id="last7days"
                      name="report-type"
                      type="radio"
                      checked={reportType === 'last7days'}
                      onChange={() => setReportType('last7days')}
                      className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300"
                    />
                    <label htmlFor="last7days" className="ml-3 block text-sm font-medium text-gray-700">
                      Last 7 Days
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      id="last30days"
                      name="report-type"
                      type="radio"
                      checked={reportType === 'last30days'}
                      onChange={() => setReportType('last30days')}
                      className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300"
                    />
                    <label htmlFor="last30days" className="ml-3 block text-sm font-medium text-gray-700">
                      Last 30 Days
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      id="custom"
                      name="report-type"
                      type="radio"
                      checked={reportType === 'custom'}
                      onChange={() => setReportType('custom')}
                      className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300"
                    />
                    <label htmlFor="custom" className="ml-3 block text-sm font-medium text-gray-700">
                      Custom Date Range
                    </label>
                  </div>
                </div>
              </fieldset>
            </div>

            {/* Custom Date Range */}
            {reportType === 'custom' && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="start-date" className="block text-sm font-medium text-gray-700">
                    Start Date
                  </label>
                  <input
                    type="date"
                    id="start-date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="end-date" className="block text-sm font-medium text-gray-700">
                    End Date
                  </label>
                  <input
                    type="date"
                    id="end-date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
              </div>
            )}

            {/* Report Info */}
            <div className="rounded-md bg-blue-50 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3 flex-1">
                  <h3 className="text-sm font-medium text-blue-800">Report Information</h3>
                  <div className="mt-2 text-sm text-blue-700">
                    <p>The report will include:</p>
                    <ul className="list-disc list-inside mt-1 space-y-1">
                      <li>All complaints from students in your department (course-based)</li>
                      <li>All complaints from employees in your department</li>
                      <li>Complete complaint details including status history</li>
                      <li>Rating and acknowledgment information</li>
                      <li>Reopen history if applicable</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Generate Button */}
            <div className="flex justify-end">
              <button
                onClick={handleGenerateReport}
                disabled={generating}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {generating ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Generating...
                  </>
                ) : (
                  <>
                    <svg className="-ml-1 mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Download Report (CSV)
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubAdminReports;
