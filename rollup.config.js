const { babel } = require("@rollup/plugin-babel")
const commonjs = require("@rollup/plugin-commonjs")
const { nodeResolve } = require("@rollup/plugin-node-resolve")
const replace = require("@rollup/plugin-replace")
const { terser } = require("rollup-plugin-terser")

const env = process.env.NODE_ENV

const config = {
  input: "src/index.js",
  plugins: [nodeResolve({ jsnext: true })]
}

if (env === "es" || env === "cjs") {
  config.output = {
    format: env,
    indent: false,
    exports: "named"
  }
  config.external = ["ramda", "shapey", "spected", "workerize"]
  config.plugins.push(
    babel({
      plugins: ["@babel/external-helpers"]
    })
  )
} else if (env === "development" || env === "production") {
  config.output = {
    format: "umd",
    name: "ruddy",
    indent: false,
    file: "build/dist/ruddy.js",
    exports: "named"
  }
  config.plugins.push(
    commonjs({
      include: [
        "node_modules/ramda/**",
        "node_modules/shapey/**",
        "node_modules/spected/**",
        "node_modules/workerize/**"
      ]
    }),
    babel({
      exclude: "node_modules/**",
      plugins: ["@babel/external-helpers"]
    }),
    replace({ "process.env.NODE_ENV": JSON.stringify(env) })
  )

  if (env === "production") {
    config.output.file = "build/dist/ruddy.min.js"
    config.plugins.push(
      terser({
        compress: {
          pure_getters: true,
          unsafe: true,
          unsafe_comps: true,
          warnings: false
        }
      })
    )
  }
}

module.exports = config
