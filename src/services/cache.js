const Cache = require('memcached-promisify');

const cache = new Cache({
    keyPrefix: 'gl',
    cacheHost: process.env.MEMCACHED_DSN,
});

module.exports = cache;
