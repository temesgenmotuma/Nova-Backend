import supabase from "../supabase";

export default async function (password: string)  {
  await supabase.auth.updateUser({ password: password });
};
