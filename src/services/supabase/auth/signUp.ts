import supabase from "../supabase";
import ModelError from "../../../Models/ModelError";

export default async function createAuthUser(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({
    email: email,
    password: password,
  });
  if (error || !data?.user)
    throw new ModelError(
      error?.message as string,
      parseInt(error?.code!) || 500
    );
  return data.user;
}
