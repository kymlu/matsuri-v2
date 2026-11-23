export type ErrorResponse = {
  message: string,
}

export type RosterKind = "dancer" | "prop";

// One kind's names and categories.
export type RosterList = {
  categories: { id: string, name: string }[], // in display order
  names: {
    id: string,
    name: string,
    categoryIds: string[], // in display order
    // Prop defaults, only present when set.
    length?: number,
    width?: number,
    color?: string,
  }[],
}

export type RosterResponse = {
  dancers: RosterList,
  props: RosterList,
}
// 曲: a song's sections in order, each with its 振り (actions) and their count names.
export type RosterSongAction = {
  id: string,
  name: string,
  counts: string[],
};

export type RosterSongSection = {
  id: string,
  name: string,
  actions: RosterSongAction[],
};

export type RosterSong = {
  id: string,
  name: string,
  sections: RosterSongSection[],
};

export type RosterSongsResponse = {
  songs: RosterSong[],
};
