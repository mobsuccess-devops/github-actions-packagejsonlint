const { readFileSync, statSync } = require("fs");

const expectedLockfileVersion = 2;

async function getPackage() {
  return JSON.parse(readFileSync("package.json").toString("utf-8"));
}

async function getPackageLock() {
  return JSON.parse(readFileSync("package-lock.json").toString("utf-8"));
}

async function hasYarnLock() {
  try {
    statSync("./yarn.lock");
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

async function checkForPreRelease() {
  const {
    dependencies = {},
    devDependencies = {},
    peerDependencies = {},
  } = await getPackage();
  const deps = { ...dependencies, ...devDependencies, ...peerDependencies };
  for (const [name, version] of Object.entries(deps)) {
    if (/^@mobsuccess-devops/.test(name) && /-pr-(\d+)\.(\d+)$/.test(version)) {
      process.stderr.write(
        `Unexpected pre-release dependency found: ${name}@${version}\n`
      );
      process.exit(1);
    }
  }
}

lint();
checkForPreRelease();
