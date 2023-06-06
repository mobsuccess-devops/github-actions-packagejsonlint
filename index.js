const checkLockVersion = require("./lib/checks/lockVersion");
const checkForPreRelease = require("./lib/checks/preReleases");
const checkForWorkspaces = require("./lib/checks/workspaces");
const hasMSBridgeConfig = require("./lib/checks/msbridge");
const hasYarnLock = require("./lib/checks/yarn");
const { FatalError } = require("./lib/errors");
const { getPackageLock, getPackage } = require("./lib/utils");

function lint() {
  const pkgLock = getPackageLock();
  const pkgJson = getPackage();
  const errors = [];
  errors.push(hasYarnLock());
  errors.push(checkLockVersion(pkgLock));
  errors.push(checkForPreRelease(pkgJson));
  errors.push(checkForWorkspaces(pkgJson));
  errors.push(hasMSBridgeConfig());
  for (const error of errors) {
    if (error instanceof FatalError) {
      process.stderr.write(`${error.message}\n`);
      process.exit(1);
    }
    if (error instanceof Error) {
      process.stderr.write(`${error.message}\n`);
    }
    if (error) {
      process.stderr.write(`${error}\n`);
    }
  }
}

lint();
