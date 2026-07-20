import { supabase } from '../lib/supabase';

const FALLBACK_SUPABASE_URL = 'https://qfitpwdrswvnbmzvkoyd.supabase.co';
const FALLBACK_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmaXRwd2Ryc3d2bmJtenZrb3lkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEzNTc4NTIsImV4cCI6MjA3NjkzMzg1Mn0.owLaj3VrcyR7_LW9xMwOTTFQupbDKlvAlVwYtbidiNE';

export async function validateAuthToken(
  token: string,
  supabaseUrl: string,
  supabaseAnonKey: string
): Promise<{ username: string; isAdmin: boolean } | null> {
  try {
    const response = await fetch(
      `${supabaseUrl}/rest/v1/auth_tokens?token=eq.${token}&expires_at=gt.${new Date().toISOString()}&select=username,is_admin,expires_at`,
      {
        headers: {
          apikey: supabaseAnonKey,
          'Content-Type': 'application/json',
        },
      }
    );

    const tokens = await response.json();

    if (tokens && tokens.length > 0) {
      return {
        username: tokens[0].username,
        isAdmin: tokens[0].is_admin,
      };
    }

    return null;
  } catch (error) {
    console.error('Token validation failed:', error);
    return null;
  }
}

export async function loginWithCredentials(
  username: string,
  password: string
): Promise<{ username: string; isAdmin: boolean; openaiApiKey: string }> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || FALLBACK_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || FALLBACK_ANON_KEY;

  const { data: users, error: userError } = await supabase
    .from('users_login')
    .select('username, password, is_admin')
    .eq('username', username)
    .maybeSingle();

  if (userError || !users) {
    throw new Error('Invalid username or password');
  }

  if (users.password !== password) {
    throw new Error('Invalid username or password');
  }

  const { data: secret, error: secretError } = await supabase
    .from('secrets')
    .select('key_value')
    .eq('key_name', 'OPENAI_API_KEY')
    .maybeSingle();

  if (secretError || !secret) {
    throw new Error('Failed to retrieve API key');
  }

  return {
    username: users.username,
    isAdmin: users.is_admin || false,
    openaiApiKey: secret.key_value,
  };
}
