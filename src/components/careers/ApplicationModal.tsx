/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaSpinner, FaUpload, FaCheck } from 'react-icons/fa';

interface ApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  role: {
    title: string;
    type: string;
  };
}

const ApplicationModal: React.FC<ApplicationModalProps> = ({ isOpen, onClose, role }) => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    coverLetter: '',
  });
  const [resume, setResume] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }
    
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/.test(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }
    
    if (!resume) {
      newErrors.resume = 'Resume is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsSubmitting(true);
    
    const formDataToSend = new FormData();
    formDataToSend.append('roleTitle', role.title);
    formDataToSend.append('roleType', role.type);
    formDataToSend.append('fullName', formData.fullName);
    formDataToSend.append('email', formData.email);
    formDataToSend.append('phone', formData.phone);
    formDataToSend.append('coverLetter', formData.coverLetter);
    if (resume) {
      formDataToSend.append('resume', resume);
    }

    try {
      const response = await fetch('/api/careers/apply', {
        method: 'POST',
        body: formDataToSend,
      });

      if (!response.ok) {
        throw new Error('Failed to submit application');
      }

      setIsSubmitted(true);
    } catch (error) {
      console.error('Error submitting application:', error);
      setErrors({ submit: 'Failed to submit application. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setErrors({ resume: 'File size should be less than 5MB' });
        return;
      }
      setResume(file);
      setErrors({ ...errors, resume: '' });
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="relative w-full max-w-2xl rounded-xl bg-white shadow-xl"
          >
            <button
              onClick={onClose}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 focus:outline-none"
            >
              <FaTimes className="h-6 w-6" />
            </button>

            <div className="p-8">
              {isSubmitted ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="mb-6 rounded-full bg-emerald-100 p-4 text-emerald-500"
                  >
                    <FaCheck className="h-8 w-8" />
                  </motion.div>
                  <h3 className="mb-2 text-2xl font-bold text-gray-900">Application Submitted!</h3>
                  <p className="text-gray-600">
                    Thank you for applying. We&apos;ll be in touch soon.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="mb-8 text-center">
                    <h2 className="text-2xl font-bold text-gray-900">Apply for {role.title}</h2>
                    <p className="mt-1 text-gray-600">{role.type}</p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Full Name</label>
                      <input
                        type="text"
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        className={`mt-1 block w-full rounded-md border ${
                          errors.fullName ? 'border-red-300' : 'border-gray-300'
                        } px-3 py-2 text-gray-900 shadow-sm focus:border-emerald-500 focus:ring-emerald-500`}
                        placeholder="John Doe"
                      />
                      {errors.fullName && (
                        <p className="mt-1 text-sm text-red-600">{errors.fullName}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Email</label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className={`mt-1 block w-full rounded-md border ${
                          errors.email ? 'border-red-300' : 'border-gray-300'
                        } px-3 py-2 text-gray-900 shadow-sm focus:border-emerald-500 focus:ring-emerald-500`}
                        placeholder="john@example.com"
                      />
                      {errors.email && (
                        <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className={`mt-1 block w-full rounded-md border ${
                          errors.phone ? 'border-red-300' : 'border-gray-300'
                        } px-3 py-2 text-gray-900 shadow-sm focus:border-emerald-500 focus:ring-emerald-500`}
                        placeholder="+254 XXX XXX XXX"
                      />
                      {errors.phone && (
                        <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Resume</label>
                      <div className="mt-1">
                        <label
                          className={`flex w-full cursor-pointer items-center justify-center rounded-md border ${
                            errors.resume ? 'border-red-300' : 'border-gray-300'
                          } bg-white px-4 py-2 shadow-sm hover:bg-gray-50`}
                        >
                          <input
                            type="file"
                            accept=".pdf,.doc,.docx"
                            onChange={handleFileChange}
                            className="hidden"
                          />
                          <FaUpload className="mr-2 h-5 w-5 text-gray-400" />
                          <span className="text-sm text-gray-600">
                            {resume ? resume.name : 'Upload Resume (PDF, DOC, DOCX)'}
                          </span>
                        </label>
                        {errors.resume && (
                          <p className="mt-1 text-sm text-red-600">{errors.resume}</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Cover Letter (Optional)</label>
                      <textarea
                        value={formData.coverLetter}
                        onChange={(e) => setFormData({ ...formData, coverLetter: e.target.value })}
                        rows={4}
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                        placeholder="Tell us why you're interested in this role..."
                      />
                    </div>
                  </div>

                  {errors.submit && (
                    <div className="rounded-md bg-red-50 p-4">
                      <p className="text-sm text-red-600">{errors.submit}</p>
                    </div>
                  )}

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="inline-flex items-center rounded-md bg-emerald-600 px-6 py-2 text-white shadow-sm hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <>
                          <FaSpinner className="mr-2 h-4 w-4 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        'Submit Application'
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ApplicationModal;
