export type User = {
  roles: Role[];
  id: string;
  providerId: string;
  lotId: string;
  email: string;
} | {
  roles: Role[];
};

export type genericUser =
    {
      id?: number;
      email?: string;
      role?: Role;
    } |
    {
      id?: string;
      providerId?: string;
      lotId?: string;
      role?: Role;
      email?: string;
    };

type Role = keyof typeof ROLES
type Permission = (typeof ROLES)[Role][number]

const ROLES = {
  admin: [
    "view:ownLots",
    "create:comments",
    "update:ownLots",
    "delete:ownLots",
    "create:lot",
  ],
  valet: ["view:comments", "create:comments"],
  attendant: [],
} as const

export function hasPermission(user: genericUser, permission: Permission) {
  const role = user.role;
  if (!role || !ROLES[role]) {
    return false; 
  }
  return (ROLES[role] as readonly Permission[])?.includes(permission);
}

// USAGE:
// const user: User = { id: "1", roles: ["valet"] }

// Can create a comment
// hasPermission(user, "create:comments")

// Can view all comments
// hasPermission(user, "view:comments")