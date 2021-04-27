const rp = require('request-promise-native');

rp('https://www.binance.com/gateway-api/v1/public/future/data/open-interest-stats', {
        json: true,
        method: 'POST',
        body: {
          name: 'BTCUSDT',
          periodMinutes: 5,
        },
      }).then(console.log)
