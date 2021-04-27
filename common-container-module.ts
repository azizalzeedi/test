import { ContainerModule } from 'inversify';
import 'reflect-metadata';
import Bottleneck from 'bottleneck';
import SocketUtils from './src/socket/socketUtils';
import * as utils from './src/utils';
import * as binanceRateLimiter from './src/binanceRateLimiter';
import {
  IBigNumberJsonParser,
  ISchedulerFactory,
  ISchedulerInstance,
  ISocketUtils,
  IUtils,
  SCHEDULER_NAMES,
  TYPES,
} from './src/interfaces';
import bottleneck from './src/bottleneck';

const jsonBigInt = require('json-bigint')({ storeAsString: true });


const commonContainerModule = new ContainerModule(bind => {
  bind<ISocketUtils>(TYPES.SocketUtils)
    .to(SocketUtils);

  bind<IUtils>(TYPES.Utils)
    .toConstantValue(utils);

  bind<IBigNumberJsonParser>(TYPES.BigNumberJsonParser)
    .toConstantValue(data => jsonBigInt.parse(data));

  bind<ISchedulerFactory>(TYPES.SchedulerFactory)
    .toFactory(() => (key: SCHEDULER_NAMES, options: any = {}): ISchedulerInstance => {
      switch (key) {
        case SCHEDULER_NAMES.CANDLES_SAVER:
          options.minTime = 10;
          break;
        case SCHEDULER_NAMES.CANDLES_RETRIEVER:
          options.maxConcurrent = 10;
          break;
        case SCHEDULER_NAMES.BINANCE_API:
          return binanceRateLimiter.getScheduler();
        case SCHEDULER_NAMES.BINANCE_CANDLES_REQUEST:
          const candlesRequestScheduler = bottleneck.getScheduler(key, {
            refreshAmount: binanceRateLimiter.getLimitNumber(),
            refreshInterval: 60 * 1000,
            maxConcurrent: 10,
          });
          candlesRequestScheduler.chain(binanceRateLimiter.getScheduler());
          return candlesRequestScheduler;
        case SCHEDULER_NAMES.BINANCE_DEPTH_REQUEST:
          const depthRequestScheduler = bottleneck.getScheduler(key, {
            refreshAmount: binanceRateLimiter.getLimitNumber(),
            refreshInterval: 60 * 1000,
            maxConcurrent: 10,
          });
          depthRequestScheduler.chain(binanceRateLimiter.getScheduler());
          return depthRequestScheduler;
        case SCHEDULER_NAMES.BOT_MESSAGE_LIMITER:
          return new Bottleneck({
            reservoir: 20,
            reservoirRefreshAmount: 20,
            reservoirRefreshInterval: 1000,
          });
      }
      return bottleneck.getScheduler(key, options);
    });
});

export default commonContainerModule;
