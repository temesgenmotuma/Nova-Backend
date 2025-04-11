import db from "../Db/db";
import crypto from "crypto";

import { Employee, Provider } from "../Controllers/employee.controller";
import { Role } from "@prisma/client";

const employeeModel = {
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
        lot:{
          select:{
            id: true,
          }
        }
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

  async createEmployee(employee:any, invitation:any ,supabaseId: string) {

    return await db.employee.create({
      data: {
        name: employee.name,
        phone: employee.phone,
        email: invitation.email,
        role: invitation.role,
        providerId: invitation.providerId,
        supabaseId,
      },
    });
  },

  async createInvitation(email: string, role: string, providerId : string){
    const token = crypto.randomBytes(32).toString("hex");
    return await db.invitation.create({
      data: {
        email,
        role: role as Role, 
        providerId,
        token,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24), 
      }
    }) 
  },
  
  async getInvitation(token: string){
    //order by date

    return await db.invitation.findFirst({
      where: {
        token,
        expiresAt: {
          gt: new Date(Date.now()).toISOString(),
        },
      },
    });
  }
};

export default employeeModel;
