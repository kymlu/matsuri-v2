import { BaseModelSchema } from "./base";
import * as z from "zod";

export const TeamSchema = BaseModelSchema.extend({
  slug: z.string()
});

export type Team = z.infer<typeof TeamSchema>;