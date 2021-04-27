const commonPointContainer = {};

function getTradeCacheContainer(stream) {
  return commonPointContainer[stream];
}

function createTradeCacheContainer(stream) {
  commonPointContainer[stream] = {};
}

function deleteTradeCacheContainer(stream) {
  delete commonPointContainer[stream];
}

function isTradeCached(stream, id) {
  let streamTrades = commonPointContainer[stream];
  return streamTrades && streamTrades[id];
}

function cacheTrade(stream, id, json) {
  if (!isTradeCached(stream, id)) {
    commonPointContainer[stream][id] = json;
  }
}

module.exports = {
  getTradeCacheContainer: getTradeCacheContainer,
  createTradeCacheContainer,
  deleteTradeCacheContainer,
  isTradeCached,
  cacheTrade,
};
