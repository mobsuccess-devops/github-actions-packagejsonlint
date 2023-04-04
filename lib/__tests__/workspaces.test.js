const { FatalError } = require("../errors");
const checkForWorkspaces = require("../checks/workspaces");

describe("Check workspaces", () => {
  it("should not return a fatal error when no workspaces are defined", () => {
    const result = checkForWorkspaces({
      dependencies: {
        "@mobsuccess-devops/pre-release": "1.0.0-pr-1.0",
      },
    });
    expect(result).toBeUndefined();
  });
  it("should not return a fatal error when workspaces are empty", () => {
    const result = checkForWorkspaces({ workspaces: [] });
    expect(result).toBeUndefined();
  });
  it("should return a fatal error when workspaces are not empty", () => {
    const result = checkForWorkspaces({ workspaces: ["../react-ui"] });
    expect(result).toBeInstanceOf(FatalError);
  });
});
