const path = require('path');
const merge = require('webpack-merge');
const common = require('./webpack.common.js');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = merge(common, {
  plugins: [
    new HtmlWebpackPlugin({
      title: 'Whale Tracker',
      template: 'views/index.pug',
      filename: path.join(__dirname, 'public/dist/index.html'),
      inject: 'head',
      alwaysWriteToDisk: true,
    }),
  ],
  devtool: 'source-map',
  mode: 'development',
});
