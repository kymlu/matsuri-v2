import { BaseModelSchema, BasePositionSchema } from "./base";
import * as z from "zod";

export const DancerSchema = BaseModelSchema.extend({
  
});

export type Dancer = z.infer<typeof DancerSchema>;

export const DancerPositionSchema = BasePositionSchema.extend(
  {
    dancerId: z.string().nonempty(),
    color: z.string().nonempty(),
  }
)

export type DancerPosition = z.infer<typeof DancerPositionSchema>;