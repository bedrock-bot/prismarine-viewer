const webpack = require('webpack')
const path = require('path')
const CopyPlugin = require('copy-webpack-plugin')

const dataSource = require('minecraft-data/minecraft-data/data/dataPaths')
const { supportedVersions } = require(path.resolve(__dirname, '../../viewer/lib/version'));
const blockedFiles = new Set();

for (const [type, typeData] of Object.entries(dataSource)) {
  for (const [version, versionDataPaths] of Object.entries(typeData)) {
    for (const [filename, loc] of Object.entries(versionDataPaths)) {
      blockedFiles.add(`./minecraft-data/data/${loc}/${filename}.json`);
    }
  }
}

for (const [version, versionDataPaths] of Object.entries(dataSource['pc'])) {
  if(supportedVersions.includes(version)){
    for (const [filename, loc] of Object.entries(versionDataPaths)) {
      blockedFiles.delete(`./minecraft-data/data/${loc}/${filename}.json`);
    }
  }
}

const config = {
  mode: 'development',
  entry: path.resolve(__dirname, './index.js'),
  output: {
    path: path.resolve(__dirname, './public'),
    filename: './index.js'
  },
  resolve: {
    fallback: {
      zlib: require.resolve('browserify-zlib'),
      stream: require.resolve('stream-browserify'),
      buffer: require.resolve('buffer/'),
      events: require.resolve('events/'),
      assert: require.resolve('assert/')
    }
  },
  plugins: [
    // fix "process is not defined" error:
    new webpack.ProvidePlugin({
      process: 'process/browser'
    }),
    new webpack.ProvidePlugin({
      Buffer: ['buffer', 'Buffer']
    }),
    new webpack.NormalModuleReplacementPlugin(
      /prismarine-viewer[/|\\]viewer[/|\\]lib[/|\\]utils/,
      './utils.web.js'
    ),
    new CopyPlugin({
      patterns: [
        { from: '../../public/blocksStates/', to: './blocksStates/' },
        { from: '../../public/textures/*.png', to: './textures/' },
        { from: '../../public/worker.js', to: './' },
      ]
    })
  ],
  devServer: {
    contentBase: path.resolve(__dirname, './public'),
    compress: true,
    inline: true,
    // open: true,
    hot: true,
    watchOptions: {
      ignored: /node_modules/
    }
  },
  externals: [
    // This removes some large unnecessary data from the bundle
    function (req, cb) {
      if (req.context.includes('minecraft-data') && req.request.endsWith('.json')) {
        const fileName = req.request.split('/').pop().replace('.json', '')
        const blocked = ['blocksB2J', 'blocksJ2B', 'blockMappings', 'steve', 'recipes']
        if (blocked.includes(fileName) || blockedFiles.has(req.request)) {
          cb(null, [])
          return
        }
      }

      cb()
    }
  ]
}

module.exports = config
