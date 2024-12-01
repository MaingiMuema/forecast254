'use client';

import { useAuth } from '@/contexts/AuthContext';
import { verifyAndSetAdminRole } from '@/app/dashboard/admin/verify-admin';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function UnauthorizedPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleVerifyAdmin = async () => {
    if (!user?.id) {
      setError('No user found. Please sign in first.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const result = await verifyAndSetAdminRole(user.id);

      if (result.success) {
        // Wait a bit for the role to propagate
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Refresh the page to update the role
        window.location.href = '/dashboard/admin';
      } else {
        setError(result.error?.message || 'Failed to verify admin role');
      }
    } catch (err) {
      console.error('Error verifying admin:', err);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-gray-100 dark:bg-gray-900">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
          Access Denied
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
          You don&apos;t have permission to access this page
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-gray-800 py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {process.env.NODE_ENV === 'development' && (
            <div className="space-y-4">
              <button
                onClick={handleVerifyAdmin}
                disabled={loading}
                className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                  loading 
                    ? 'bg-red-400 cursor-not-allowed' 
                    : 'bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500'
                }`}
              >
                {loading ? 'Verifying...' : 'Verify/Set Admin Role'}
              </button>
              {error && (
                <div className="text-sm text-red-600 dark:text-red-400 text-center">
                  {error}
                </div>
              )}
            </div>
          )}
          
          <div className="mt-6">
            <button
              onClick={() => router.push('/')}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
            >
              Return Home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
