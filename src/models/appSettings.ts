import * as z from "zod";

export const DancerDisplayTypeSchema = z.enum(["small", "large"]);
export type DancerDisplayType = z.infer<typeof DancerDisplayTypeSchema>;

export const AppSettingSchema = z.object({
  snapToGrid: z.boolean().default(true),
  showGrid: z.boolean().default(true),
  dancerDisplayType: DancerDisplayTypeSchema,
});

export type AppSetting = z.infer<typeof AppSettingSchema>;