import * as express from 'express';
import { Customer } from '@prisma/client'; 

type employeePayload = {
    provider: {
        id: string;
    };
    lot: {
        id: string;
    } | null;
    id: string;
    email: string;
    role: $Enums.Role;
};

type customerPayload = {
    email: string;
    username: string | null;
    id: string;
    supabaseId: string;
};

type payloadType = employeePayload | customerPayload | null;

type reqUser = {
    id: string;
    providerId?: string;
    lotId?: string;
    role?: $Enums.Role;
    email?: string;

}

declare global {
    namespace Express {
        interface Request {
            user?: reqUser;
        }
    }
}