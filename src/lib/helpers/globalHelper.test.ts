import { strCompare } from "./globalHelper";

describe("strCompare", () => {
  it("sorts numbers by value", () => {
    const names = ["10", "2", "1", "11", "3"].map(name => ({ name }));
    expect(names.sort((a, b) => strCompare(a, b, "name")).map(x => x.name))
      .toEqual(["1", "2", "3", "10", "11"]);
  });

  it("sorts numbers inside names by value", () => {
    const names = ["第10回", "第2回", "第1回"].map(name => ({ name }));
    expect(names.sort((a, b) => strCompare(a, b, "name")).map(x => x.name))
      .toEqual(["第1回", "第2回", "第10回"]);
  });
});
