const { spawnSync } = require("child_process");
const { readFileSync } = require("fs");

function getPackage() {
  try {
    return JSON.parse(readFileSync("package.json").toString("utf-8"));
  } catch {
    return undefined;
  }
}

/**
 * Return the list of all package.json files, except for those in node_modules folder. This is useful for monorepos.
 */
function getAllPackages() {
  const result = spawnSync(
    "find",
    [".", "-name", "package.json", "-not", "-path", "./node_modules/*"],
    { stdio: ["ignore", "pipe", "ignore"] }
  );
  if (result.status !== 0) {
    throw new Error(`find command failed with status ${result.status}`);
  }
  const stdout = result.stdout.toString("utf-8");
  let filenames = stdout.split("\n").filter((line) => line.length > 0);
  filenames = filenames.map((filename) => filename.replace("./", ""));
  const filesContent = filenames.map((filename) => {
    return JSON.parse(readFileSync(filename).toString("utf-8"));
  });
  return filesContent.map((fileContent, index) => {
    return {
      filename: filenames[index],
      content: fileContent,
    };
  });
}

function getPackageLock() {
  try {
    return JSON.parse(readFileSync("package-lock.json").toString("utf-8"));
  } catch {
    return undefined;
  }
}

module.exports = {
  getPackage,
  getAllPackages,
  getPackageLock,
};
