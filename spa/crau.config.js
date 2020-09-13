import webpackMerge from "webpack-merge";

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

export const webpackPlugins = [];
export function modifyWebpack(config) {
  return webpackMerge(config, tsConfig);
}
