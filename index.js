const { readFile, stat } = require("fs/promises");

const expectedLockfileVersion = 1;

async function getPackage() {
  return JSON.parse((await readFile("package.json")).toString("utf-8"));
}

async function getPackageLock() {
  return JSON.parse((await readFile("package-lock.json")).toString("utf-8"));
}

async function hasYarnLock() {
  try {
    await stat("./yarn.lock");
    return true;
  } catch (e) {
    return false;
  }
}

async function lint() {
  if (await hasYarnLock()) {
    process.stderr.write(`Unexpected yarn.lock file detected\n`);
    process.exit(1);
  }

  process.stderr.write(
    `Lintint package.json for package ${(await getPackage()).name}\n`
  );

  try {
    const { lockfileVersion } = await getPackageLock();
    if (lockfileVersion !== expectedLockfileVersion) {
      process.stderr.write(
        `Unexpected lockfileVersion, found “${lockfileVersion}”, expected “${expectedLockfileVersion}”\n`
      );
      process.exit(1);
    }
  } catch (e) {
    process.stderr.write(
      `No package-lock.json file, ignoring lockfileVersion check\n`
    );
  }
}

lint();
