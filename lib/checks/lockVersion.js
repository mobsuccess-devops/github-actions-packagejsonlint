const { FatalError } = require("../errors");

const expectedLockfileVersion = 2;

function checkLockVersion(lockFile) {
  if (!lockFile) {
    return new Error(
      "No package-lock.json file, ignoring lockfileVersion check"
    );
  }
  if (lockFile.lockfileVersion !== expectedLockfileVersion) {
    return new FatalError(
      `Unexpected lockfileVersion, found “${lockFile.lockfileVersion}”, expected “${expectedLockfileVersion}”`
    );
  }
}

module.exports = checkLockVersion;
