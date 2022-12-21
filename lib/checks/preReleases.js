const { FatalError } = require("../errors");

function checkForPreRelease(pkgJson = {}) {
  const {
    dependencies = {},
    devDependencies = {},
    peerDependencies = {},
  } = pkgJson;
  const deps = { ...dependencies, ...devDependencies, ...peerDependencies };
  for (const [name, version] of Object.entries(deps)) {
    if (/^@mobsuccess-devops/.test(name) && /-pr-(\d+)\.(\d+)$/.test(version)) {
      return new FatalError(
        `Unexpected pre-release dependency found: ${name}@${version}\n`
      );
    }
  }
}

module.exports = checkForPreRelease;