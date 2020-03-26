const { Log } = require('../models');
const axios = require('axios').default;
const jsdom = require('jsdom');
const { JSDOM } = jsdom;

module.exports = {
    async index(req, res) {
        axios
            .post('https://servicos.gollog.com.br/Rastreamento/Consultar', {
                TipoBusca: 1,
                'CampoPrefixoConhecimentoAerio[0]': req.params.acn,
                'CampoConhecimentoAerio[0]': req.params.ref,
                'CampoPrefixoConhecimentoAerio[1]': '',
                'CampoConhecimentoAerio[1]': '',
                'CampoPrefixoConhecimentoAerio[2]': '',
                'CampoConhecimentoAerio[2]': '',
                'CampoPrefixoConhecimentoAerio[3]': '',
                'CampoConhecimentoAerio[3]': '',
                'CampoPrefixoConhecimentoAerio[4]': '',
                'CampoConhecimentoAerio[4]': '',
                'CampoPrefixoConhecimentoAerio[5]': '',
                'CampoConhecimentoAerio[5]': '',
                'CampoPrefixoConhecimentoAerio[6]': '',
                'CampoConhecimentoAerio[6]': '',
                'CampoPrefixoConhecimentoAerio[7]': '',
                'CampoConhecimentoAerio[7]': '',
                'CampoPrefixoConhecimentoAerio[8]': '',
                'CampoConhecimentoAerio[8]': '',
                'CampoPrefixoConhecimentoAerio[9]': '',
                'CampoConhecimentoAerio[9]': '',
                NumReferencia: '',
                BuscarNotaFiscalEscolhido: 0,
                NumeroDoDocument: '',
                'BuscaNotaFiscal[0]': '',
                'BuscaNotaFiscal[1]': '',
                'BuscaNotaFiscal[2]': '',
                'BuscaNotaFiscal[3]': '',
                'BuscaNotaFiscal[4]': '',
                'BuscaNotaFiscal[5]': '',
                'BuscaNotaFiscal[6]': '',
                'BuscaNotaFiscal[7]': '',
                'BuscaNotaFiscal[8]': '',
                'BuscaNotaFiscal[9]': '',
            })
            .then(function (response) {
                const dom = new JSDOM(response.data);
                const document = dom.window.document;

                var nodeList = document.querySelectorAll('p.p_aside_botton');
                var i;
                var tracks = [];
                var respArr = [];

                // NodeList {
                //     '0': HTMLParagraphElement {},
                //     '1': HTMLParagraphElement {},
                //     ...
                for (i = 0; i < nodeList.length; ++i) {
                    tracks.push(nodeList[i].textContent.trim());
                }

                if (nodeList.length > 0) {
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
                        ip: req.headers['HTTP_CF_CONNECTING_IP'] || '127.0.0.1',
                        json_response: JSON.stringify(respArr['result']['tracking']),
                        dt_created: Date.now(),
                    }).then(log => {
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
                    ip: req.cf_ip || '127.0.0.1',
                    json_response: JSON.stringify(error),
                    dt_created: Date.now(),
                });

                return res.json({ error: { code: 500, message: 'Somethings wrong.' } });
            });
    },
};
