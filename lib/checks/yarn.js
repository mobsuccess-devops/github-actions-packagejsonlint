const { statSync } = require("fs");
const { FatalError } = require("../errors");

function hasYarnLock() {
  try {
    if (statSync("yarn.lock").isFile()) {
      return new FatalError("Unexpected yarn.lock file detected");
    }
  } catch (e) {
    return undefined;
  }
}

module.exports = hasYarnLock;
