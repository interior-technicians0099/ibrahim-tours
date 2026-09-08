import { DefaultSession } from "next-auth";
import { Role } from "@prisma/client";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      userId: string;
      role: Role;
      operatorId?: string | null;
      mustChangePassword: boolean;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    userId?: string;
    role: Role;
    operatorId?: string | null;
    mustChangePassword?: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    userId?: string;
    role: Role;
    operatorId?: string | null;
    mustChangePassword?: boolean;
  }
}
