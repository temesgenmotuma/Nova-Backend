import supabase from "../supabase";

export default async function sendResetPasswordEmail(email: string) {
  try {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email);
    return { data, error };
  } catch (error) {
    throw error;
  }
}
