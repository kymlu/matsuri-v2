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