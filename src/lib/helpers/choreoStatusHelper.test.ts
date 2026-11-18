import { statusWithoutTeamList } from "./choreoStatusHelper";

describe("statusWithoutTeamList", () => {
  it("keeps a published chart from looking unpublished", () => {
    expect(statusWithoutTeamList({ version: 3 })).toBe("edited");
  });
  it("leaves a never-published chart as 未公開", () => {
    expect(statusWithoutTeamList({ version: undefined })).toBe("localOnly");
    expect(statusWithoutTeamList({ version: 0 })).toBe("localOnly");
  });
});
