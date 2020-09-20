const webpackMerge = require("webpack-merge").default;

const tsConfig = {
  resolve: {
    extensions: [".ts", ".tsx", ".js"],
  },
  module: {
    rules: [
      {
        test: /\.(ts|tsx)$/,
        loaders: "ts-loader",
        options: {
          configFile: "tsconfig.server.json",
        },
      },
      {
        test: /\.s[ac]ss$/i,
        use: ["isomorphic-style-loader", "css-loader", "sass-loader"],
      },
    ],
  },
};

function modifyWebpack(config) {
  return webpackMerge(config, tsConfig);
}

module.exports = {
  modifyWebpack: modifyWebpack,
  webpackPlugins: [],
};
