/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    
    // Extract form data
    const roleTitle = formData.get('roleTitle') as string;
    const roleType = formData.get('roleType') as string;
    const fullName = formData.get('fullName') as string;
    const email = formData.get('email') as string;
    const phone = formData.get('phone') as string;
    const coverLetter = formData.get('coverLetter') as string;
    const resume = formData.get('resume') as File;

    // Validate required fields
    if (!roleTitle || !roleType || !fullName || !email || !phone) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Handle resume upload if provided
    let resumeUrl = null;
    if (resume) {
      try {
        // Check if bucket exists
        const { data: buckets, error: bucketsError } = await supabase
          .storage
          .listBuckets();

        if (bucketsError) {
          throw new Error('Failed to check storage buckets');
        }

        const resumesBucketExists = buckets.some(bucket => bucket.name === 'resumes');
        if (!resumesBucketExists) {
          // Create the bucket if it doesn't exist
          const { error: createBucketError } = await supabase
            .storage
            .createBucket('resumes', {
              public: false,
              fileSizeLimit: 5242880, // 5MB
              allowedMimeTypes: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
            });

          if (createBucketError) {
            throw new Error('Failed to create storage bucket');
          }
        }

        const bytes = await resume.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const timestamp = Date.now();
        const fileExt = resume.name.split('.').pop();
        const sanitizedName = resume.name.replace(/[^a-zA-Z0-9]/g, '_');
        const fileName = `${timestamp}-${sanitizedName}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('resumes')
          .upload(fileName, buffer, {
            contentType: resume.type,
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) {
          console.error('Resume upload error:', uploadError);
          throw new Error('Failed to upload resume');
        }

        // Get the public URL for the uploaded file
        const { data: { publicUrl } } = supabase.storage
          .from('resumes')
          .getPublicUrl(fileName);

        resumeUrl = publicUrl;
      } catch (error) {
        console.error('Resume upload error:', error);
        return NextResponse.json(
          { error: 'Failed to upload resume. Please try again.' },
          { status: 500 }
        );
      }
    }

    // Insert application into database
    const { data, error } = await supabase
      .from('applications')
      .insert([
        {
          role_title: roleTitle,
          role_type: roleType,
          full_name: fullName,
          email,
          phone,
          resume_url: resumeUrl,
          cover_letter: coverLetter,
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to submit application' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: 'Application submitted successfully', data },
      { status: 201 }
    );

  } catch (error) {
    console.error('Application submission error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
