export type User = {
  roles: Role[];
  id: string;
  providerId: string;
  lotId: string;
  email: string;
} | {
  roles: Role[];
};

type Role = keyof typeof ROLES
type Permission = (typeof ROLES)[Role][number]

const ROLES = {
  admin: [
    "view:ownLots",
    "create:comments",
    "update:ownLots",
    "delete:ownLots",
  ],
  valet: ["view:comments", "create:comments"],
} as const

export function hasPermission(user: User, permission: Permission) {
  return user.roles.some(role =>
    (ROLES[role] as readonly Permission[]).includes(permission)
  )
}

// USAGE:
const user: User = { id: "1", roles: ["valet"] }

// Can create a comment
hasPermission(user, "create:comments")

// Can view all comments
hasPermission(user, "view:comments")