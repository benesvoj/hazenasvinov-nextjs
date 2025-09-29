'use server';

import {revalidatePath} from 'next/cache';
import {redirect} from 'next/navigation';

import {createClient} from '@/utils/supabase/server';

import {publicRoutes, privateRoutes} from '@/routes/routes';

export async function login(formData: FormData) {
  const supabase = await createClient();
  // type-casting here for convenience
  // in practice, you should validate your inputs
  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  };

  const {error} = await supabase.auth.signInWithPassword(data);

  if (error) {
    redirect(publicRoutes.error);
  }
  revalidatePath(privateRoutes.admin, 'layout');
  redirect(privateRoutes.admin);
}

export async function signup(formData: FormData) {
  const supabase = await createClient();

  // type-casting here for convenience
  // in practice, you should validate your inputs
  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  };

  const {data: signupData, error} = await supabase.auth.signUp(data);

  if (error) {
    redirect(publicRoutes.error);
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

  revalidatePath(privateRoutes.admin, 'layout');
  redirect(privateRoutes.admin);
}

export async function logout() {
  const supabase = await createClient();

  const {error} = await supabase.auth.signOut();

  if (error) {
    redirect('/error');
  }

  revalidatePath(publicRoutes.login, 'layout');
  redirect(publicRoutes.login);
}
