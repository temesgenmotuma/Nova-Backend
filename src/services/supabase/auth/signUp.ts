import supabase from "../supabase";

export default async function createAuthUser(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({
    email: email,
    password: password,
  });
  if (error || !data?.user) throw error;
  return data.user;
}
