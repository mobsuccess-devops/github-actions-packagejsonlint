const { FatalError } = require("../errors");
const checkLockVersion = require("../checks/lockVersion");

describe("Check lockFile version", () => {
  it("should return a fatal error", () => {
    const result = checkLockVersion({
      lockfileVersion: 1,
    });
    expect(result).toBeInstanceOf(FatalError);
  });
  it("Should return a non-fatal error", () => {
    const result = checkLockVersion();
    expect(result).toBeInstanceOf(Error);
    expect(result).not.toBeInstanceOf(FatalError);
  });

  it("Should return undefined", () => {
    const result = checkLockVersion({
      lockfileVersion: 2,
    });
    expect(result).toBeUndefined();
  });
});
