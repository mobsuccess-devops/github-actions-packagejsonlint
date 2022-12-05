jest.mock("fs");
const { statSync } = require("fs");
const hasYarnLock = require("../checks/yarn");
const { FatalError } = require("../errors");

jest.mocked(statSync).mockImplementationOnce((path) => {
  if (/yarn\.lock$/.test(path)) {
    return { isFile: () => true };
  }
});

describe("Fail if yarn.lock exists", () => {
  it("should fail", () => {
    expect(hasYarnLock()).toBeInstanceOf(FatalError);
  });
  it("Should succeed", () => {
    expect(hasYarnLock()).toBeUndefined();
  });
});
