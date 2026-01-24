import * as z from "zod";

export const AppSettingSchema = z.object({
  snapToGrid: z.boolean(),
  dancerSize: z.number().positive()
});

export type AppSetting = z.infer<typeof AppSettingSchema>;