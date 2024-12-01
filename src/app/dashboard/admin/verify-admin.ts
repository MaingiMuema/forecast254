import { supabase } from '@/lib/supabase';

interface VerifyResult {
  success: boolean;
  message?: string;
  error?: Error | { message: string };
}

export async function verifyAndSetAdminRole(userId: string): Promise<VerifyResult> {
  if (!userId) {
    return { 
      success: false, 
      error: new Error('User ID is required') 
    };
  }

  try {
    // First, verify the user exists in auth.users
    const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(userId);
    
    if (authError || !authUser) {
      console.error('Error verifying user in auth.users:', authError);
      return { 
        success: false, 
        error: authError || new Error('User not found in auth system')
      };
    }

    // Check if user has a profile
    const { data: profile, error: fetchError } = await supabase
      .from('profiles')
      .select('role, email')
      .eq('id', userId)
      .single();

    if (fetchError) {
      console.error('Error fetching profile:', fetchError);
      return { 
        success: false, 
        error: fetchError 
      };
    }

    // If no profile exists, create one with admin role
    if (!profile) {
      const { error: createError } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          role: 'admin',
          email: authUser.user.email,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (createError) {
        console.error('Error creating profile:', createError);
        return { 
          success: false, 
          error: createError 
        };
      }

      return { 
        success: true, 
        message: 'Created new admin profile' 
      };
    }

    // Update role to admin if not already
    if (profile.role !== 'admin') {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          role: 'admin',
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (updateError) {
        console.error('Error updating role:', updateError);
        return { 
          success: false, 
          error: updateError 
        };
      }

      return { 
        success: true, 
        message: 'Role updated to admin' 
      };
    }

    return { 
      success: true, 
      message: 'Already an admin' 
    };
  } catch (error) {
    console.error('Unexpected error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error : new Error('Unknown error occurred') 
    };
  }
}
