const { Log } = require('../models');
const axios = require('axios').default;
const { SocksProxyAgent } = require('socks-proxy-agent');
const UserAgent = require('user-agents');
const userAgent = new UserAgent();

module.exports = {
    async index(req, res) {
        const agent = process.env.NODE_ENV == 'dev' ? null : new SocksProxyAgent('socks5h://127.0.0.1:9050');

        axios
            .get('https://servicos.gollog.com.br/api/services/app/Tracking/GetAllByCodes?Values=' + req.params.acn + req.params.ref, {
                httpsAgent: agent !== null ? agent : false,
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

                if (tracks.length > 0) {
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
                }

                return res.json(respArr);
            })
            .catch(function (error) {
                // log error
                Log.create({
                    acn: req.params.acn,
                    ref: req.params.ref,
                    ip: req.clientIp || '127.0.0.1',
                    json_response: JSON.stringify(error),
                    dt_created: Date.now(),
                });

                return res.json({ error: { code: 500, message: 'Somethings wrong.' } });
            });
    },
};
