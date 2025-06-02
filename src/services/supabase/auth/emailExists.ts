import supabase from "../supabase";
import ModelError from "../../../Models/ModelError";

const emailExists = async (email: string) => {
  const { data, error } = await supabase.from("User").select('*');
  if (error) {
    throw new ModelError(`Error checking email existence: ${error.message}`, 500);
  }
  return data;
};
