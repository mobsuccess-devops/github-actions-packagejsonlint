const { FatalError } = require("../errors");

function checkForWorkspaces(pkgJson = {}) {
  const { workspaces = [] } = pkgJson;
  if (workspaces.length > 0) {
    return new FatalError(`Unexpected workspaces found: ${workspaces}\n`);
  }
}

module.exports = checkForWorkspaces;
