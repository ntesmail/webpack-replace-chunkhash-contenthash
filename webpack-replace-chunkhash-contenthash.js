/**
 * Author sweetyx
 * replace webpack output js files chunkhash with the final conent md5. 
 */

const crypto = require('crypto');

// 替换aseet的内容
function replaceStringInAsset(asset, oldHash, newHash) {
    const sourceRE = new RegExp(oldHash, 'g');

    if (typeof asset === 'string') {
        return asset.replace(sourceRE, newHash);
    }

    // ReplaceSource
    if ('_source' in asset) {
        asset._source = replaceStringInAsset(asset._source, oldHash, newHash);
        return asset;
    }

    // CachedSource
    if ('_cachedSource' in asset) {
        asset._cachedSource = asset.source().replace(sourceRE, newHash);
        return asset;
    }

    // RawSource / SourceMapSource
    if ('_value' in asset) {
        asset._value = asset.source().replace(sourceRE, newHash);
        return asset;
    }

    // ConcatSource
    if ('children' in asset) {
        asset.children = asset.children.map(child => replaceStringInAsset(child, oldHash, newHash));
        return asset;
    }

    throw new Error(`Unknown asset type (${asset.constructor.name})!. `);
}

// 替换chunk files中关联的asset(oldHash -> newHash)
function replaceOldHashForNewInChunkFiles(chunk, assets, oldHashToNewHashMap) {
    Object.keys(oldHashToNewHashMap).forEach((oldHash) => {
        const newHash = oldHashToNewHashMap[oldHash];
        chunk.files.forEach((file) => {
            const asset = assets[file];
            replaceStringInAsset(asset, oldHash, newHash);
        });
    });
}

// 重新计算hash并更新assets
function reHashChunk(chunk, assets, oldHashToNewHashMap, outputOptions) {
    replaceOldHashForNewInChunkFiles(chunk, assets, oldHashToNewHashMap);

    // 使用旧hash获取asset
    const oldRenderedHash = chunk.renderedHash;
    const oldChunkName = chunk.files[0];
    const asset = assets[oldChunkName];

    // 使用chunk的实际内容计算新的hash值
    const input = asset.source();
    const hashObj = crypto.createHash(outputOptions.hashFunction).update(input);
    if (outputOptions.hashSalt) {
        hashObj.update(outputOptions.hashSalt);
    }
    const fullHash = hashObj.digest(outputOptions.hashDigest);
    const newRenderedHash = fullHash.substr(0, outputOptions.hashDigestLength);
    // 使用新hash替换旧的文件名
    let oldHash;
    let newHash;
    if (outputOptions.chunkHashLength) {
        oldHash = oldRenderedHash.substr(0, outputOptions.chunkHashLength);
        newHash = newRenderedHash.substr(0, outputOptions.chunkHashLength);
    }
    else {
        oldHash = oldRenderedHash;
        newHash = newRenderedHash;
    }
    const newChunkName = oldChunkName.replace(oldHash, newHash);

    // 修改chunk的hash和文件名
    chunk.hash = fullHash;
    chunk.renderedHash = newRenderedHash;
    chunk.files[0] = newChunkName;

    // 修改asset的名称
    asset._name = newChunkName;

    // 修改assets集合中的映射关系（oldChunkName ->asset 改为 newChunkName ->asset）
    delete assets[oldChunkName];
    assets[newChunkName] = asset;

    // 修改nameMap
    oldHashToNewHashMap[oldHash] = newHash;

    replaceOldHashForNewInChunkFiles(chunk, assets, oldHashToNewHashMap);
}

function ContentHash(options = {}) {
    this.manifestFiles = options.manifestFiles || []; //如果使用了CommonsChunkPlugin，需要声明manifestFiles。
    this.chunkHashLength = options.chunkHashLength; //chunkhash的长度
}

ContentHash.prototype.apply = function apply(compiler) {
    compiler.plugin('compilation', (compilation) => {
        // 获取webpack配置
        const outputOptions = compilation.outputOptions;
        outputOptions.chunkHashLength = this.chunkHashLength;
        // 记录chunks
        compilation.plugin('after-optimize-chunk-assets', (chunks) => {
            this.chunks = chunks;
        });
        // 编译的最后阶段，开始替换hash
        compilation.plugin('after-optimize-assets', (assets) => {
            //复制数组
            const nonManifestChunks = this.chunks.filter(
                chunk => !this.manifestFiles.includes(chunk.name)
            );
            //把chunks没有parents的放前面
            const chunksByDependency = [];
            while (nonManifestChunks.length) {
                let i = 0;
                while (i < nonManifestChunks.length) {
                    const current = nonManifestChunks[i];
                    if (
                        !current.parents
                        || current.parents.length === 0
                        || current.parents.every(p => chunksByDependency.indexOf(p) !== -1 || nonManifestChunks.indexOf(p) === -1)
                    ) {
                        chunksByDependency.push(current);
                        nonManifestChunks.splice(i, 1);
                    } else {
                        i += 1;
                    }
                }
            }
            //反转，把chunks按有parents的放前面（无依赖的js在最前面）
            const chunksByDependencyDesc = chunksByDependency.reverse();
            const oldHashToNewHashMap = {};
            //处理nonManifestChunks
            chunksByDependencyDesc.forEach((chunk) => {
                reHashChunk(chunk, assets, oldHashToNewHashMap, outputOptions);
            });

            //处理manifestChunks
            const manifestChunks = this.chunks.filter(chunk => this.manifestFiles.includes(chunk.name));
            manifestChunks.forEach((chunk) => {
                reHashChunk(chunk, assets, oldHashToNewHashMap, outputOptions);
            });
        });
    });
};

module.exports = ContentHash;
