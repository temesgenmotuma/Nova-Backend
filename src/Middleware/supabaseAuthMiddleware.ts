import { Request, Response, NextFunction } from "express";
import supabase from "../services/supabase/supabase";
import customerModel from "../Models/customer.model";
import providerModel from "../Models/employee.model";

type customerPayload = {
  id: string;
  username: string | null;
  email: string;
  supabaseId: string;
};

type employeePayload = {
  id: string;
  email: string;
  role: string;
  provider: {
    id: string;
  };
  lot: {
    id: string;
  } | null;
};

type ProviderOrCustomer = 'provider' | 'customer';

type ValidClientType = 
  | [ProviderOrCustomer] 
  | [ProviderOrCustomer, ProviderOrCustomer];

export default function protect(validClients: string[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      console.error("Unauthorized: No authorization header provided.");
      res
        .status(401)
        .json({ message: "Unauthorized: No authorization header provided." });
      return;
    }
    const accessToken = authHeader.split(" ")[1];

    const clientType = req.headers["x-client-type"] as string;
    if(!validClients.includes(clientType)){
      console.error("Unauthorized: Invalid client type.");
      res.status(401).json({ message: "Unauthorized: Invalid client type." });
      return;
    }

    try {
      const { data, error } = await supabase.auth.getUser(accessToken);
      if (error) {
        console.error("Failed to get supabase auth user", error);
        res
          .status(401)
          .json({ message: "Unauthorized: Supabase sign in failed." });
        return;
      }

      const supaId = data.user.id;
      let user: employeePayload | customerPayload | null;
      if (clientType === "customer") {
        user = await customerModel.getCustomerBySupabaseId(supaId);
        if (!user) {
          res.status(404).json({ message: "User not found" });
          return;
        }

        req.user = {
          id: user?.id,
          email: user?.email,
        };
      } else if (clientType === "provider") {
        user = await providerModel.getEmployeeBySupabaseId(supaId);
        if (!user) {
          res.status(404).json({ message: "User not found" });
          return;
        }

        req.user = {
          id: user?.id,
          providerId: user?.provider.id,
          lotId: user?.lot?.id,
          role: user?.role,
          email: user?.email,
        };
      } else {
        console.error("Invalid or no client-type header provided.");
        res
          .status(401)
          .json({ message: "Invalid or no client-type header provided." });
        return;
      }
      next();
      
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Error authenticating user." });
    }
  };
}
