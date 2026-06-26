import z from "zod";
import { BaseModelSchema } from "./base";

export const RoleTypeSchema = z.enum(["editor", "admin"]);
export type RoleType = z.infer<typeof RoleTypeSchema>;

export const UserSchema = BaseModelSchema.extend({
  email: z.string().nonempty(),
  role: RoleTypeSchema
});

export type User = z.infer<typeof UserSchema>;