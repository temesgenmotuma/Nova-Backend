import supabase from "../supabase";

export default async function authSignin (email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email,
    password: password,
  });
  if (error || !data?.session) throw error;
  return data.session.access_token;
}