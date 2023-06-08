const path = require("path")

/**
 * The file/folder paths used when creating the build commands.
 *
 * @typedef {object} Paths
 * @property {string} src The path to the ruddy source files
 * @property {string} build The path to the ruddy build output
 * @property {string} copy The path to the copyfiles binary
 * @property {string} README The path to the ruddy project README (markdown) file
 * @property {string} pkg The path to the package.json for the ruddy repo
 * @property {string} babel The path to the babel binary
 * @property {string} jsdoc The path to the jsdoc binary
 * @property {string} eslint The path to the eslint binary
 * @property {string} rollup The path to the rollup binary
 * @property {string} tape The path to the tape binary
 */

/**
 * Resolves the file/folder paths used when creating the build commands.
 *
 * @function
 * @name getPaths
 * @returns {Paths} An object containing the paths to the files/folders used in the ruddy package build
 */
function getPaths() {
  const resolvePath = rel => path.resolve(__dirname, "..", rel)
  const src = resolvePath("src")

  return {
    src,
    build: resolvePath("build"),
    copy: resolvePath("node_modules/.bin/copyfiles"),
    README: resolvePath("README.md"),
    pkg: resolvePath("build/package.json"),
    babel: resolvePath("node_modules/.bin/babel"),
    jsdoc: resolvePath("node_modules/.bin/jsdoc"),
    eslint: resolvePath("node_modules/.bin/eslint"),
    rollup: resolvePath("node_modules/.bin/rollup"),
    tape: resolvePath("node_modules/.bin/tape")
  }
}

module.exports = getPaths
