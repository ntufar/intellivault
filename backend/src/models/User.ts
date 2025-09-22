import { z } from "zod";

export enum UserRole {
  Admin = "admin",
  Analyst = "analyst",
  Viewer = "viewer",
}

export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  role: z.nativeEnum(UserRole),
  created_at: z.string().datetime(),
});

export type User = z.infer<typeof UserSchema>;


