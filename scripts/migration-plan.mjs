// @ts-check
/**
 * @param {string} path
 * @returns {string}
 */
export function migrationName(path) {
  return path.split("/").pop() ?? path;
}

/**
 * @param {string} path
 * @returns {boolean}
 */
export function isMigrationFile(path) {
  return path.endsWith(".sql");
}

/**
 * @param {Iterable<string>} paths
 * @param {Iterable<string>} applied
 * @returns {{ name: string, path: string }[]}
 */
export function pendingMigrations(paths, applied) {
  const done = new Set(applied);
  return [...paths]
    .filter(isMigrationFile)
    .map((path) => ({ name: migrationName(path), path }))
    .sort((a, b) => a.name.localeCompare(b.name))
    .filter(({ name }) => !done.has(name));
}

/**
 * Split a migration file into single statements. Neon pooled connections
 * reject multiple commands in one query; our migrations have no procedure
 * bodies, so splitting on `;` is safe.
 * @param {string} text
 * @returns {string[]}
 */
export function sqlStatements(text) {
  return text
    .split(";")
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
}
