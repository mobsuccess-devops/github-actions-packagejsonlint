const { FatalError } = require("../errors");
const checkForPreRelease = require("../checks/preReleases");

describe("Check lockFile version", () => {
  it("should return a fatal error on pre-released dependency", () => {
    const result = checkForPreRelease({
      dependencies: {
        "@mobsuccess-devops/pre-release": "1.0.0-pr-1.0",
      },
    });
    expect(result).toBeInstanceOf(FatalError);
  });
  it("should return a fatal error on pre-released devDependency", () => {
    const result = checkForPreRelease({
      devDependencies: {
        "@mobsuccess-devops/pre-release": "1.0.0-pr-1.0",
      },
    });
    expect(result).toBeInstanceOf(FatalError);
  });
  it("should return a fatal error on pre-released peerDependency", () => {
    const result = checkForPreRelease({
      peerDependencies: {
        "@mobsuccess-devops/pre-release": "1.0.0-pr-1.0",
      },
    });
    expect(result).toBeInstanceOf(FatalError);
  });

  it("Should return undefined", () => {
    const result = checkForPreRelease({
      dependencies: {
        "@mobsuccess-devops/release": "1.0.0",
      },
      devDependencies: {
        "@mobsuccess-devops/release": "1.0.0",
      },
      peerDependencies: {
        "@mobsuccess-devops/release": "1.0.0",
      },
    });
    expect(result).toBeUndefined();
  });
});
