const { readdirSync } = require("fs");
const { FatalError } = require("../errors");

function hasMSBridgeConfig() {
  try {
    const allRootFiles = readdirSync(".");
    for (const file of allRootFiles) {
      if (file.startsWith(".msbridge") && file.endsWith(".json")) {
        return new FatalError("Unexpected " + file + " file detected");
      }
    }
  } catch (e) {
    return undefined;
  }
}

module.exports = hasMSBridgeConfig;
