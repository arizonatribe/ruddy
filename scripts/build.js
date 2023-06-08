#!/usr/bin/env node

const chalk = require("chalk")
const fse = require("fs-extra")
const { spawnSync } = require("child_process")
const pkg = require("../package.json")
const getPaths = require("./paths")
const getCommands = require("./commands")

require("@babel/register")

/**
 * Prepares the ruddy package for publishing to NPM
 *
 * @function
 * @name runBuild
 */
function runBuild() {
  let exitStatus = 0
  try {
    console.log(chalk.cyan("Resolving paths to various build tools and source files/folders"))
    const paths = getPaths()

    console.log(chalk.cyan("Clearing out previous build"))
    fse.emptyDirSync(paths.build)

    console.log(chalk.cyan("Creating a new package.json file for the build"))

    const { name: nm, author, version, license, keywords, repository, description: desc } = pkg
    const distPkgJson = {
      main: "index.js",
      module: "es/index.js",
      "jsnext:main": "es/index.js",
      browser: "dist/ruddy.js",
      name: nm,
      author,
      version,
      license,
      keywords,
      repository,
      description: desc
    }

    fse.writeJsonSync(paths.pkg, distPkgJson, { spaces: 2 })

    console.log(chalk.cyan("Copying the README.md to the build"))
    fse.copySync(paths.README, `${paths.build}/README.md`)

    console.log(chalk.cyan("Creating list of commands to execute with the build tools (tests, linting, etc.)"))
    const commands = getCommands({ ...process.env }, paths)

    commands.forEach(({ command, args, context, description, name }) => {
      console.log(chalk.cyan(`${name} . . .`))
      const { status, error } = spawnSync(command, args, context)
      exitStatus = status

      if (error) {
        console.log(`${chalk.yellow("Failed during")} ${chalk.yellow.bold(name)}`)
        throw error
      }

      console.log(chalk.cyan(description))
    })

    console.log(chalk.green(`Successfully created a new build at: '${paths.build}' 🚀`))
    console.log(`${chalk.yellow("Ready to publish via:")} ${chalk.cyan("npm run dist")}`)

    process.exit(exitStatus)
  } catch (err) {
    console.error(chalk.red(err))
    process.exit(exitStatus || 1)
  }
}

runBuild()
