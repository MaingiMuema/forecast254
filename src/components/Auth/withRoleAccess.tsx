/* eslint-disable @typescript-eslint/no-explicit-any */
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { ComponentType, useEffect, useState } from 'react';

type AllowedRoles = 'admin' | 'validator' | 'user';

export function withRoleAccess(
  WrappedComponent: ComponentType<any>,
  allowedRoles: AllowedRoles[]
) {
  return function WithRoleAccessWrapper(props: any) {
    const { role, loading } = useAuth();
    const router = useRouter();
    const [hasAccess, setHasAccess] = useState<boolean | null>(null);

    useEffect(() => {
      // Get role from localStorage as fallback
      const storedRole = localStorage.getItem('userRole') as AllowedRoles;
      
      const checkAccess = () => {
        console.log('withRoleAccess - Checking access');
        console.log('Current role:', role);
        console.log('Stored role:', storedRole);
        console.log('Allowed roles:', allowedRoles);
        console.log('Loading:', loading);

        // Use current role or fallback to stored role
        const effectiveRole = role || storedRole;
        
        if (!loading && effectiveRole) {
          const access = allowedRoles.includes(effectiveRole);
          console.log('Access granted:', access);
          setHasAccess(access);
          
          if (!access) {
            console.log('Access denied - Redirecting to unauthorized page');
            router.push('/unauthorized');
          }
        }
      };

      checkAccess();
    }, [loading, role, router]);

    if (loading || hasAccess === null) {
      return <div>Loading...</div>;
    }

    if (!hasAccess) {
      return null;
    }

    return <WrappedComponent {...props} />;
  };
}
