import { useState, useRef } from 'react';
import { useRouter } from 'next/router';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { 
  FiSend, 
  FiX, 
  FiAlertCircle,
  FiCheck,
  FiUpload
} from 'react-icons/fi';

const SubmitComplaint = () => {
  const router = useRouter();
  const fileInputRef = useRef(null);
  
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  // Word count helper
  const getWordCount = (text) => {
    if (!text || typeof text !== 'string') return 0;
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  };

  const wordCount = getWordCount(content);
  const minWords = 10;
  const maxWords = 5000;
  const isWordCountValid = wordCount >= minWords && wordCount <= maxWords;

  // Handle image selection
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    
    if (file) {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
      if (!validTypes.includes(file.type)) {
        toast.error('Only JPG, JPEG, and PNG images are allowed');
        return;
      }

      // Validate file size (5MB)
      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        toast.error('Image size must be less than 5MB');
        return;
      }

      setImage(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Remove selected image
  const removeImage = () => {
    setImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});

    // Validate subject
    if (!subject.trim() || subject.trim().length < 5) {
      setErrors({ subject: 'Subject must be at least 5 characters' });
      return;
    }

    // Validate content
    if (!isWordCountValid) {
      setErrors({ content: `Content must be between ${minWords} and ${maxWords} words` });
      return;
    }

    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('subject', subject.trim());
      formData.append('content', content);
      
      if (image) {
        formData.append('image', image);
      }

      const response = await api.post('/api/student/complaints', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (response.data.success) {
        const complaintId = response.data.data.complaint.complaintId;
        toast.success(`Complaint ${complaintId} submitted successfully!`);
        router.push('/student/complaints');
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Failed to submit complaint';
      const validationErrors = error.response?.data?.errors;
      
      if (validationErrors) {
        const errObj = {};
        validationErrors.forEach(err => {
          errObj[err.field] = err.message;
        });
        setErrors(errObj);
      }
      
      toast.error(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-screen-xl mx-auto">
      <div className="mb-6 pb-4 border-b border-gray-200">
        <h1 className="text-xl font-semibold text-gray-900">Submit Complaint</h1>
        <p className="text-sm text-gray-600 mt-1">Share your concern with the administration.</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Subject Field */}
          <div>
            <label className="block text-sm font-medium text-gray-800 mb-2">
              Subject <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              maxLength={200}
              className={`w-full px-3 py-3 border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 placeholder:text-gray-400 ${
                errors.subject ? 'border-red-500' : 'border-gray-200'
              }`}
              placeholder="Brief subject of your complaint (e.g., 'Hostel Water Supply Issue')"
              required
            />
            {errors.subject && (
              <span className="text-red-600 text-xs flex items-center gap-1 mt-1">
                <FiAlertCircle />
                {errors.subject}
              </span>
            )}
            <p className="text-xs text-gray-500 mt-1">{subject.length}/200 characters</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Content Textarea */}
            <div className="lg:col-span-8">
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                <label className="block text-sm font-medium text-gray-800 mb-2">
                  Complaint Details <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={14}
                  className={`w-full px-3 py-3 border rounded-lg bg-white resize-none focus:outline-none focus:ring-2 focus:ring-primary-500 placeholder:text-gray-400 ${
                    errors.content ? 'border-red-500' : 'border-gray-200'
                  }`}
                  placeholder="Describe what happened, when/where it occurred, and any details that can help the administration address it."
                  required
                />

                {/* Word Count */}
                <div className="flex items-center justify-between mt-2">
                  <div className="min-w-0">
                    {errors.content ? (
                      <span className="text-red-600 text-xs flex items-center gap-1">
                        <FiAlertCircle />
                        <span className="truncate">{errors.content}</span>
                      </span>
                    ) : isWordCountValid ? (
                      <span className="text-green-700 text-xs flex items-center gap-1">
                        <FiCheck />
                        Ready
                      </span>
                    ) : (
                      <span className="text-gray-600 text-xs">Minimum {minWords} words</span>
                    )}
                  </div>
                  <span
                    className={`text-xs text-right ${
                      wordCount < minWords
                        ? 'text-red-600'
                        : wordCount > maxWords
                          ? 'text-red-600'
                          : 'text-gray-500'
                    }`}
                  >
                    {wordCount} / {maxWords}
                  </span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-4 space-y-4">
              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Attach Image (Optional)
                </label>

                {!imagePreview ? (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer bg-gray-50 hover:bg-gray-100/50"
                  >
                    <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-gray-100 text-gray-600">
                      <FiUpload />
                    </div>
                    <p className="text-sm font-medium text-gray-900 mt-3">Upload an image</p>
                    <p className="text-xs text-gray-500 mt-1">JPG / JPEG / PNG (max 5MB)</p>
                  </div>
                ) : (
                  <div className="relative border border-gray-200 rounded-lg overflow-hidden">
                    <img src={imagePreview} alt="Preview" className="w-full h-56 object-contain bg-gray-50" />
                    <button
                      type="button"
                      onClick={removeImage}
                      className="absolute top-2 right-2 w-9 h-9 inline-flex items-center justify-center bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
                    >
                      <FiX size={16} />
                    </button>
                    <div className="p-3 bg-gray-50 border-t border-gray-200">
                      <p className="text-sm text-gray-600 truncate">{image?.name}</p>
                      <p className="text-xs text-gray-400">{(image?.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                  </div>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".jpg,.jpeg,.png"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </div>

              {/* Guidelines */}
              <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-3">
                <p className="text-xs font-medium text-gray-700">Guidelines</p>
                <p className="text-xs text-gray-600 mt-2">
                  Keep it respectful. Minimum {minWords} words. Add an image only if it supports your complaint.
                </p>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="sticky bottom-0 bg-white/95 backdrop-blur border-t border-gray-200 -mx-4 sm:-mx-6 px-4 sm:px-6 py-3">
            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
              <button
                type="button"
                onClick={() => router.push('/student')}
                className="w-full sm:w-auto px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || !isWordCountValid}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Submitting...
                  </>
                ) : (
                  <>
                    <FiSend />
                    Submit
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SubmitComplaint;
