import * as z from "zod";

export const DancerActionTimingsSchema = z.object({
  timing: z.string().nonempty(),
  dancerIds: z.array(z.string().nonempty()),
});

export type DancerActionTimings = z.infer<typeof DancerActionTimingsSchema>;

export const DancerActionSchema = z.object({
  name: z.string().nonempty(),
  timings: z.record(z.string().nonempty(), DancerActionTimingsSchema),
});

export type DancerAction = z.infer<typeof DancerActionSchema>;