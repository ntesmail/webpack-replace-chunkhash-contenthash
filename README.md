# webpack-replace-chunkhash-contenthash

replace webpack output js files chunkhash with the final conent md5. 

## Installation

With npm
```
npm install webpack-replace-chunkhash-contenthash --save-dev
```

With yarn
```
yarn add webpack-replace-chunkhash-contenthash --dev
```

## Usage

Just add this plugin as usual.

```javascript
// webpack.config.js
const ContentHash = require('webpack-replace-chunkhash-contenthash');

module.exports = {
    // ...
    output: {
        //...
        filename: '[name].[chunkhash].js',
    },
    plugins: [
        new ContentHash(options)
    ]
};
```

## Options

### `options.manifestFiles`

type: Array[string] , default to [].

if you are generating a common chunk, it needs to be here. 

Examples

```javascript
const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const ContentHash = require('webpack-replace-chunkhash-contenthash');
module.exports = {
    entry: { w: './w.js', v: './v.js' },
    output: {
        path: path.resolve(__dirname, 'build'),
        filename: '[name].[chunkhash:12].js',
        chunkFilename: '[name].[chunkhash:12].js',
    },
    module: {},
    plugins: [
        new webpack.HashedModuleIdsPlugin(),
        new webpack.NamedChunksPlugin(),
        new webpack.optimize.OccurrenceOrderPlugin(),
        new webpack.optimize.CommonsChunkPlugin({
            name: "zentry",//entry
            chunks: ['v']
        }),
        new webpack.optimize.CommonsChunkPlugin({
            name: "jquery",//jquery
            chunks: ['v'],
            minChunks: module => /jquery/.test(module.resource)
        }),
        new webpack.optimize.CommonsChunkPlugin({
            name: "thirdparty",//thirdparty
            chunks: ['v'],
            minChunks: module => /node_modules/.test(module.resource)
        }),
        new HtmlWebpackPlugin({
            filename: 'index.html',
            template: './index.html',
            chunksSortMode: 'manual',
            chunks: ['w', 'zentry', 'jquery', 'thirdparty', 'v']
        }),
        new ContentHash({
            manifestFiles: ['zentry'],
            chunkHashLength: 12
        }),
    ]
};
```

### `options.chunkHashLength`

type: number , default to empty.

the final js file chunkhash length.