import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { 
  FiSend, 
  FiImage, 
  FiX, 
  FiAlertCircle,
  FiCheck,
  FiUpload
} from 'react-icons/fi';

const SubmitComplaint = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  
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

    // Validate
    if (!isWordCountValid) {
      setErrors({ content: `Content must be between ${minWords} and ${maxWords} words` });
      return;
    }

    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('content', content);
      
      if (image) {
        formData.append('image', image);
      }

      const response = await api.post('/api/student/complaints', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (response.data.success) {
        toast.success('Complaint submitted successfully!');
        navigate('/student/complaints');
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
    <div className="max-w-3xl mx-auto animate-fadeIn">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Submit Complaint</h1>
        <p className="text-gray-500 mt-1">
          Share your concerns, feedback, or suggestions with the administration
        </p>
      </div>

      {/* Form Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Content Textarea */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Complaint / Feedback Details <span className="text-red-500">*</span>
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={10}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 resize-none ${
                errors.content ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Please describe your complaint, feedback, or suggestion in detail. Be specific about the issue, when and where it occurred, and any relevant information that could help address your concern..."
              required
            />
            
            {/* Word Count */}
            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center gap-2">
                {errors.content ? (
                  <span className="text-red-500 text-sm flex items-center gap-1">
                    <FiAlertCircle />
                    {errors.content}
                  </span>
                ) : isWordCountValid ? (
                  <span className="text-green-600 text-sm flex items-center gap-1">
                    <FiCheck />
                    Word count valid
                  </span>
                ) : (
                  <span className="text-gray-500 text-sm">
                    Minimum {minWords} words required
                  </span>
                )}
              </div>
              <span className={`text-sm ${
                wordCount < minWords ? 'text-red-500' : 
                wordCount > maxWords ? 'text-red-500' : 'text-gray-500'
              }`}>
                {wordCount} / {maxWords} words
              </span>
            </div>
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Attach Image (Optional)
            </label>
            
            {!imagePreview ? (
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-primary-400 hover:bg-primary-50 transition-colors"
              >
                <FiUpload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-600 mb-1">
                  Click to upload an image
                </p>
                <p className="text-xs text-gray-400">
                  JPG, JPEG, PNG (max 5MB)
                </p>
              </div>
            ) : (
              <div className="relative border rounded-lg overflow-hidden">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full h-64 object-contain bg-gray-50"
                />
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                >
                  <FiX size={16} />
                </button>
                <div className="p-3 bg-gray-50 border-t">
                  <p className="text-sm text-gray-600 truncate">
                    {image?.name}
                  </p>
                  <p className="text-xs text-gray-400">
                    {(image?.size / 1024 / 1024).toFixed(2)} MB
                  </p>
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
          <div className="bg-blue-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-blue-700 mb-2 flex items-center gap-2">
              <FiAlertCircle />
              Submission Guidelines
            </h4>
            <ul className="text-sm text-blue-600 space-y-1">
              <li>• Be clear and specific about your concern</li>
              <li>• Include relevant dates, times, and locations</li>
              <li>• Attach supporting images if applicable</li>
              <li>• Content must be between {minWords} and {maxWords} words</li>
              <li>• Maintain respectful and professional language</li>
            </ul>
          </div>

          {/* Submit Button */}
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => navigate('/student')}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !isWordCountValid}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 gradient-primary text-white font-medium rounded-lg hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
                  Submit Complaint
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SubmitComplaint;
