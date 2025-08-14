const path = require("path");
const { rspack } = require("@rspack/core");
const pkg = require("./package.json");
const { getNormalizedRemoteName } = require("@curatedotfun/utils");

module.exports = {
  // No single entry needed, as we are exposing modules directly.
  // Rspack will build the exposed files as entries.
  mode: process.env.NODE_ENV === "development" ? "development" : "production",
  target: "async-node",
  devtool: "source-map",
  output: {
    uniqueName: getNormalizedRemoteName(pkg.name),
    publicPath: "auto",
    path: path.resolve(__dirname, "dist"),
    clean: true,
    library: { type: "commonjs-module" },
  },
  devServer: {
    static: path.join(__dirname, "dist"),
    hot: true,
    // A single port for both plugins
    port: 3005,
    devMiddleware: {
      writeToDisk: true,
    },
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: "builtin:swc-loader",
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: [".ts", ".js"],
  },
  plugins: [
    new rspack.container.ModuleFederationPlugin({
      name: getNormalizedRemoteName(pkg.name),
      filename: "remoteEntry.js",
      runtimePlugins: [
        require.resolve("@module-federation/node/runtimePlugin"),
      ],
      library: { type: "commonjs-module" },
      exposes: {
        "./source": "./src/plugins/source.ts",
        "./plugin": "./src/plugins/distributor.ts", // TODO:
      },
      shared: {
        effect: {
          singleton: true,
          requiredVersion: "^3.17.6",
        },
        zod: {
          singleton: true,
          requiredVersion: "^4.0.8",
        },
        // Share the core SDK to ensure single instance
        "@usersdotfun/core-sdk": {
          singleton: true,
          requiredVersion: "workspace:*",
        },
      },
    }),
  ],
};
