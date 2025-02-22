import db from "../Db/db";

import { Employee, Provider } from "../Controllers/employee.controller";
import { Role } from "@prisma/client";

const providerModel = {
  async getProvider(name: string) {
    return await db.provider.findUnique({
      where: {
        name: name.toLowerCase(),
      },
    });
  },

  async getEmployeeByEmail(email: string) {
    return await db.employee.findUnique({
      where: {
        email,
      },
      include:{
        provider: true,
      }
    });
  },

  async getEmployeeBySupabaseId(supabaseId: string) {
    return await db.employee.findUnique({
      where: {
        supabaseId,
      },
      select: {
        id: true,
        email: true,
        role: true,
        provider: {
          select: {
            id: true,
          },
        },
      },
    });
  },

  async signup(employee: Employee, provider: Provider, supabaseId: string) {
    const email = employee.email;
    return await db.employee.create({
      data: {
        name: employee.name.toLowerCase(),
        phone: employee.phone,
        email: email,
        role: "Admin",
        supabaseId: supabaseId,
        provider: {
          create: {
            ...(provider.email && { email: provider.email }),
            name: provider.name,
            phone: provider.phone,
            hasValet: provider.hasValet,
            supabaseId: supabaseId,
          },
        },
      },
      include: {
        provider: true,
      },
    });
  },

  async addEmployee(email: string, role: string) {
    // return await db.employee.create({
    //   // data: {
    //   //   name:"dkjfa",
    //   //   phone:"123456789",
        
    //   //   providerId:"1"
    //   // },
    // });
  },

  async createInvitation(email: string, role: string, providerId : string){
    return await db.invitation.create({
      data: {
        email,
        role: role as Role, 
        providerId,
        expiresAt: new Date(Date.now()) 
      }
    }) 
  }
};

export default providerModel;
