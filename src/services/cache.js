const Cache = require('memcached-promisify');

const cache = new Cache({
    keyPrefix: 'gl',
    cacheHost: process.env.MEMCACHED_DSN,
    cacheTimeout: 43200, // 12 hours
});

module.exports = cache;
