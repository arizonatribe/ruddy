/**
 * A command to be run
 *
 * @typedef {object} Command
 * @property {string} name The command name (short description)
 * @property {string} command The shell command to be run
 * @property {Array<string>} [args] The command-line args to be passed into the shell command
 * @property {string} [description] The long description of the command being run
 * @property {object} [context] The NodeJs child_process context. This usually means env vars and configuration values for stdin/stderr/stdout
 */

/**
 * Creates the individual commands to be run during the build, using the env vars and resolved file/folder paths.
 *
 * @function
 * @name getCommands
 * @param {object} env An object representing the environment variables
 * @param {object} paths An object representing the resolved file/folder paths used in the build
 * @returns {Array<Command>} A list of commands to run during the build
 */
function getCommands(env, paths) {
  return [{
    name: "linting",
    command: paths.eslint,
    args: ["src"],
    context: { stdio: "inherit", env },
    description: "✅ Linted the source files"
  }, {
    name: "testing",
    command: paths.tape,
    args: ["--require=@babel/register", "test/index.js"],
    context: { stdio: "inherit", env, shell: true },
    description: "✅ Ran the unit tests"
  }, {
    name: "transpiling (cjs)",
    command: paths.babel,
    args: ["src", "--out-dir", "build"],
    context: { stdio: "inherit", env: { ...env, BABEL_ENV: "cjs" } },
    description: "✅ Transpiled to CommonJs files"
  }, {
    name: "transpiling (esm)",
    command: paths.babel,
    args: ["src", "--out-dir", "build/es"],
    context: { stdio: "inherit", env: { ...env, BABEL_ENV: "es" } },
    description: "✅ Transpiled to ES Modules (ESM) files"
  }, {
    name: "transpiling (umd)",
    command: paths.rollup,
    args: ["-c"],
    context: { stdio: "inherit", env: { ...env, NODE_ENV: "development" } },
    description: "✅ Transpiled to Universal Module Definition (UMD) files (minified)"
  }, {
    name: "transpiling (umd minified)",
    command: paths.rollup,
    args: ["-c"],
    context: { stdio: "inherit", env: { ...env, NODE_ENV: "production" } },
    description: "✅ Transpiled to Universal Module Definition (UMD) files (minified)"
  }]
}

module.exports = getCommands
