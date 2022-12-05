const { readFileSync } = require("fs");

function getPackage() {
  try {
    return JSON.parse(readFileSync("package.json").toString("utf-8"));
  } catch {
    return undefined;
  }
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
  getPackageLock,
};
