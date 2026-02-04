import * as z from "zod";
import { BaseModelSchema } from "./base";

export const DancerActionTimingSchema = BaseModelSchema.extend({
  dancerIds: z.array(z.string().nonempty()),
});

export type DancerActionTiming = z.infer<typeof DancerActionTimingSchema>;

export const DancerActionSchema = BaseModelSchema.extend({
  timings: z.array(DancerActionTimingSchema),
});

export type DancerAction = z.infer<typeof DancerActionSchema>;