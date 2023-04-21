jest.mock("fs");
const { readdirSync } = require("fs");
const { FatalError } = require("../errors");
const hasMSBridgeConfig = require("../checks/msbridge");

describe("Fail if yarn.lock exists", () => {
  it("should fail for local config", () => {
    jest
      .mocked(readdirSync)
      .mockImplementationOnce(() => [
        "index.js",
        ".msbridge.json",
        "package.json",
      ]);
    expect(hasMSBridgeConfig()).toBeInstanceOf(FatalError);
  });
  it("should fail for amplify config", () => {
    jest
      .mocked(readdirSync)
      .mockImplementationOnce(() => [
        "index.js",
        ".msbridge.amplify.json",
        "package.json",
      ]);
    expect(hasMSBridgeConfig()).toBeInstanceOf(FatalError);
  });
  it("should fail for standard config", () => {
    jest
      .mocked(readdirSync)
      .mockImplementationOnce(() => [
        "index.js",
        ".msbridge.json",
        "package.json",
      ]);
    expect(hasMSBridgeConfig()).toBeInstanceOf(FatalError);
  });
  it("should not fail when no config", () => {
    jest
      .mocked(readdirSync)
      .mockImplementationOnce(() => ["index.js", "package.json"]);
    expect(hasMSBridgeConfig()).toBeUndefined();
  });
});
