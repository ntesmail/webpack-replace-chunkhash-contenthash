const webpack = require('webpack');
const buildConfig = require('./webpack.build.config.js');
webpack(buildConfig, function (err, states) {
    if (err) {
        throw err;
    }
    process.stdout.write(states.toString({
        bail: true,
        colors: true,
        modules: true,
        children: false,
        chunks: true,
        chunkModules: false
    }) + '\n');
});