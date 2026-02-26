'use server';

import {revalidatePath} from 'next/cache';
import {redirect} from 'next/navigation';

import {supabaseServerClient} from '@/utils/supabase/server';

import {APP_ROUTES} from '@/lib';

export async function login(formData: FormData) {
  const supabase = await supabaseServerClient();
  // type-casting here for convenience
  // in practice, you should validate your inputs
  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  };

  const {error} = await supabase.auth.signInWithPassword(data);

  if (error) {
    redirect(APP_ROUTES.auth.error);
  }
  revalidatePath(APP_ROUTES.admin.root, 'layout');
  redirect(APP_ROUTES.admin.root);
}

export async function signup(formData: FormData) {
  const supabase = await supabaseServerClient();

  // type-casting here for convenience
  // in practice, you should validate your inputs
  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  };

  const {data: signupData, error} = await supabase.auth.signUp(data);

  if (error) {
    redirect(APP_ROUTES.auth.error);
  }

  // If user was created successfully, ensure they have a profile
  if (signupData.user) {
    try {
      // Use the safe profile function to ensure profile exists
      const {error: profileError} = await supabase.rpc('get_user_profile_safe', {
        user_uuid: signupData.user.id,
      });

      if (profileError) {
        console.error('Error ensuring user profile:', profileError);
        // Don't fail the signup, just log the error
        // The trigger should have created the profile automatically
      }
    } catch (err) {
      console.error('Error in profile creation fallback:', err);
      // Don't fail the signup, just log the error
    }
  }

  revalidatePath(APP_ROUTES.admin.root, 'layout');
  redirect(APP_ROUTES.admin.root);
}

export async function logout() {
  const supabase = await supabaseServerClient();

  const {error} = await supabase.auth.signOut();

  if (error) {
    redirect(APP_ROUTES.auth.error);
  }

  revalidatePath(APP_ROUTES.auth.login, 'layout');
  redirect(APP_ROUTES.auth.login);
}
