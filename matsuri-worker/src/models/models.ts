export type ErrorResponse = {
  message: string,
}
export type RosterResponse = {
  categories: { id: string, name: string }[], // in display order
  names: { id: string, name: string, categoryIds: string[] }[], // categoryIds in display order
}
