'use server';

import {revalidatePath} from 'next/cache';

import {supabaseServerClient} from '@/utils/supabase/server';

/**
 * Betting Authentication Actions
 * Separate auth functions for the betting system
 */

export async function bettingLogin(email: string, password: string) {
  const supabase = await supabaseServerClient();

  const {data, error} = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return {
      success: false,
      error: error.message,
    };
  }

  // Revalidate betting page to clear any cached data
  revalidatePath('/betting', 'layout');

  // Return success - client will handle redirect with window.location.href
  // to ensure full page reload and auth state refresh
  return {
    success: true,
    user: data.user,
  };
}

export async function bettingSignup(email: string, password: string, fullName?: string) {
  const supabase = await supabaseServerClient();

  const {data: signupData, error} = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
    },
  });

  if (error) {
    return {
      success: false,
      error: error.message,
    };
  }

  // If user was created successfully, create wallet
  if (signupData.user) {
    try {
      // Wallet will be created automatically via getOrCreateWallet
      // when the user first accesses the betting system
      console.log('New betting user created:', signupData.user.id);
    } catch (err) {
      console.error('Error in user creation:', err);
    }
  }

  revalidatePath('/betting', 'layout');

  return {
    success: true,
    user: signupData.user,
    message:
      signupData.user?.identities?.length === 0
        ? 'Please check your email to confirm your account.'
        : 'Account created successfully!',
  };
}

export async function bettingLogout() {
  const supabase = await supabaseServerClient();

  const {error} = await supabase.auth.signOut();

  if (error) {
    return {
      success: false,
      error: error.message,
    };
  }

  // Revalidate betting page to clear any cached data
  revalidatePath('/betting', 'layout');

  // Note: Client-side will handle the redirect with window.location.href
  // to ensure clean state after logout

  return {
    success: true,
  };
}

export async function getCurrentBettingUser() {
  const supabase = await supabaseServerClient();

  const {
    data: {user},
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  return user;
}
