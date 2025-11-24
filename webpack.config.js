const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = [
  // Main process
  {
    name: 'main',
    mode: 'development',
    entry: './src/main/main.ts',
    target: 'electron-main',
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: 'main.js'
    },
    devtool: 'source-map',
    module: {
      rules: [
        {
          test: /\.ts?$/,
          use: 'ts-loader',
          exclude: /node_modules/
        }
      ]
    },
    resolve: {
      extensions: ['.ts', '.js']
    },
    externals: {
      keytar: 'commonjs keytar'
    }
  },
  // Preload
  {
    name: 'preload',
    mode: 'development',
    entry: './src/main/preload.ts',
    target: 'electron-preload',
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: 'preload.js'
    },
    devtool: 'source-map',
    module: {
      rules: [
        {
          test: /\.ts?$/,
          use: 'ts-loader',
          exclude: /node_modules/
        }
      ]
    },
    resolve: {
      extensions: ['.ts', '.js']
    }
  },
  // Renderer process
  {
    name: 'renderer',
    mode: 'development',
    entry: './src/renderer/index.tsx',
    target: 'web',
    output: {
      path: path.resolve(__dirname, 'dist/renderer'),
      filename: 'renderer.js',
      globalObject: 'self',
    },
    devServer: {
      port: 3000,
      hot: false,
      liveReload: true,
      historyApiFallback: true,
      headers: {
        'Access-Control-Allow-Origin': '*'
      }
    },
    devtool: 'source-map',
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          use: 'ts-loader',
          exclude: /node_modules/
        },
        {
          test: /\.css$/,
          use: ['style-loader', 'css-loader']
        }
      ]
    },
    resolve: {
      extensions: ['.tsx', '.ts', '.js'],
      alias: {
        '@': path.resolve(__dirname, 'src')
      },
      fallback: {
        events: false,
        path: false,
        fs: false,
        util: false,
        assert: false
      }
    },
    plugins: [
      new HtmlWebpackPlugin({
        template: './public/index.html',
        filename: 'index.html'
      })
    ]
  }
];