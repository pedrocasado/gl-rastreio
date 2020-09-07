const CircularJSON = require('circular-json');
const { Log } = require('../models');
const UserAgent = require('user-agents');
const userAgent = new UserAgent();
const cache = require('../services/cache');
const cacheTimeout = 43200; // 12 hours
const torAxios = require('tor-axios');
const tor = torAxios.torSetup({
    ip: '127.0.0.1',
    port: 9050,
    controlPort: '9051',
    controlPassword: process.env.TOR_PASS
})

module.exports = {
    async index(req, res) {
        const cacheKey = req.params.acn + req.params.ref;

        const cachedTracks = await cache.get(cacheKey);
        if (cachedTracks == undefined) {

            const cachedIp = await cache.get('cachedIp');
            if (cachedIp == undefined) {
                // Grab new ip
                await tor.torNewSession();

                cache.set('cachedIp', '1', 7200).then((data) => {
                    // console.log('save cache success');
                });
            }

            tor
                .get('https://servicos.gollog.com.br/api/services/app/Tracking/GetAllByCodes?Values=' + req.params.acn + req.params.ref, {
                    headers: {
                        'User-Agent': userAgent.toString(),
                    },
                })
                .then(function (response) {
                    const result = response.data.result;
                    var tracks = [];
                    var respArr = [];
                    if (result[0] && result[0].events.length > 0) {
                        result[0].events.forEach((element) => {
                            tracks.push(element.date.trim() + ' | ' + element.message.trim());
                        });
                    }

                    respArr = {
                        result: {
                            acn: req.params.acn,
                            ref: req.params.ref,
                            tracking: tracks,
                        },
                    };

                    // create Log
                    Log.create({
                        acn: req.params.acn,
                        ref: req.params.ref,
                        ip: req.clientIp || '127.0.0.1',
                        json_response: JSON.stringify(respArr['result']['tracking']),
                        dt_created: Date.now(),
                    }).then((log) => {
                        // console.log('log auto-generated ID:', log.id);
                    });

                    // sets cache
                    cache.set(cacheKey, tracks, cacheTimeout).then((data) => {
                        // console.log('save cache success');
                    });

                    return res.json(respArr);
                })
                .catch(function (error) {
                    // log error
                    Log.create({
                        acn: req.params.acn,
                        ref: req.params.ref,
                        ip: req.clientIp || '127.0.0.1',
                        json_response: CircularJSON.stringify({ error: error.response }),
                        dt_created: Date.now(),
                    });
                    return res.json({ error: { code: 500, message: 'Somethings wrong.' } });
                });
        } else {
            // Return cached response
            // console.log('returning cached response');

            Log.create({
                acn: req.params.acn,
                ref: req.params.ref,
                ip: req.clientIp || '127.0.0.1',
                json_response: JSON.stringify(cachedTracks),
                dt_created: Date.now(),
                cached: 1,
            }).then((log) => {
                // console.log('log auto-generated ID:', log.id);
            });

            respArr = {
                result: {
                    acn: req.params.acn,
                    ref: req.params.ref,
                    tracking: cachedTracks,
                },
            };

            return res.json(respArr);
        }
    },

    async status(req, res) {
        await tor.torNewSession();

        tor
            .get('http://api.ipify.org', {})
            .then(function (response) {
                return res.json(response.data);
            })
            .catch(function (err) {
                return res.json('NOK');
            });
    },
};
