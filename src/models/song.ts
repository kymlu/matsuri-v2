import * as z from "zod";

// 曲: a team's songs. Each section has its 振り (dancerActions in a choreo) with their count names.
// A choreo keeps the song's id (Choreo.songId); nothing points back here.
export const RosterSongActionSchema = z.object({
  id: z.string().nonempty(),
  name: z.string().nonempty(),
  counts: z.array(z.string()),
});

export type RosterSongAction = z.infer<typeof RosterSongActionSchema>;

export const RosterSongSectionSchema = z.object({
  id: z.string().nonempty(),
  name: z.string().nonempty(),
  actions: z.array(RosterSongActionSchema),
});

export type RosterSongSection = z.infer<typeof RosterSongSectionSchema>;

export const RosterSongSchema = z.object({
  id: z.string().nonempty(),
  name: z.string().nonempty(),
  sections: z.array(RosterSongSectionSchema),
});

export type RosterSong = z.infer<typeof RosterSongSchema>;

export const RosterSongsSchema = z.object({
  songs: z.array(RosterSongSchema),
});

export type RosterSongs = z.infer<typeof RosterSongsSchema>;

// Saves that create something also return its id.
export const RosterSongsWithIdSchema = RosterSongsSchema.extend({ id: z.string() });

export type RosterSongsWithId = z.infer<typeof RosterSongsWithIdSchema>;

export const AddSongSectionsResultSchema = RosterSongsSchema.extend({
  added: z.number(),
  skipped: z.array(z.object({
    name: z.string(),
    reason: z.enum(["too_long", "exists"]),
  })),
});

export type AddSongSectionsResult = z.infer<typeof AddSongSectionsResultSchema>;
