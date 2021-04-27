import { ContainerModule, interfaces } from 'inversify';
import 'reflect-metadata';
import { TRADING_PLATFORM_NAME } from './src/config/config';
import commonContainerModule from './common-container-module';
import {
  Database as DatabaseNamespace,
  IAlertFormatter,
  IAlertFormatterType,
  IBinanceUtils,
  IBotCommandHandler,
  IBotsManager,
  ICandles,
  ICandlesAnalysis,
  ICandlesService,
  IDepthService,
  IExchangeInfoService,
  IIntervalCloseWatcher,
  IMissingHandler,
  IOrderBook,
  IPairUserWatchers,
  IPlatformApiFetcher,
  IPlatformSpecs,
  IPlotCreator,
  ISaveTradesListener,
  ISchedulerFactory,
  ISocketDataHandler,
  ISocketIOManager,
  ISocketsManager,
  ITelegrafWrapperFactory,
  ITickerService,
  ITradesService,
  ITradeWatcher,
  IWatcherFactory,
  IWatcherOptionsFactory,
  TradingPlatformName,
  TYPES,
} from './src/interfaces';
import { AggregatedTrades, IWatcherOptions } from './src/common/types';
import SocketsManager from './src/socket/socketsManager';
import BinanceTickerService from './src/socket/binance/BinanceTickerService';
import BinanceMissingHandler from './src/socket/binance/BinanceMissingHandler';
import SocketDataHandler from './src/socket/dataHandler';
import BinanceTradesService from './src/socket/binance/BinanceTradesService';
import BinanceDepthService from './src/socket/binance/BinanceDepthService';
import BinanceCandlesService from './src/socket/binance/BinanceCandelsService';
import BinanceExchangeInfoService from './src/socket/binance/BinanceExchangeInfoService';
import SocketIOManager from './src/SocketIOManager';
import Database from './src/database';
import BinanceUtils from './src/socket/binance/BinanceUtils';
import BinanceApiFetcher from './src/socket/binance/BinanceApiFetcher';
import Candles from './src/candles/Candles';
import CandlesAnalysis from './src/candles/analysis';
import TradeWatcher from './src/tradeWatcher/tradeWatcher';
import WatcherFactory from './src/tradeWatcher/watcherFactory';
import BaseAlertFormatter from './src/tradeWatcher/BaseFormatter';
import OrderBook from './src/orderBook/OrderBook';
import { BOT_IDS, TRADE_WATCHER_IDS } from './src/common/common';
import { getEnvNumber } from './src/utils';
import IntervalCloseWatcher from './src/IntervalCloseWatcher';
import BotsManager from './src/bot/BotsManager';
import container from './container';
import PlotCreator from './src/plot/PlotCreator';
import PairUserWatchers from './src/PairUserWatchers';
import TelegrafWrapper from './src/bot/telegram/TelegrafWrapper';
import priceDetailsCommand from './src/bot/inquiriesBot/commands/priceDetails';
import { IOpenInterestService } from './src/interfaces/IOpenInterestService';
import OpenInterestService from './src/OpenInterestService';

const applicationDependencies = new ContainerModule(bind => {
  let platformSpecs: IPlatformSpecs | null = null;

  const isBinanceFutures = !!process.env.IS_BINANCE_FUTURES;
  if (TRADING_PLATFORM_NAME === 'binance') {
    bind<ITradesService>(TYPES.TradesSocket)
      .to(BinanceTradesService)
      .inSingletonScope();

    bind<ITickerService>(TYPES.TickerService)
      .to(BinanceTickerService)
      .inSingletonScope();

    bind<IDepthService>(TYPES.DepthService)
      .to(BinanceDepthService)
      .inSingletonScope();

    bind<ICandlesService>(TYPES.CandlesSocket)
      .to(BinanceCandlesService)
      .inSingletonScope();

    bind<IMissingHandler>(TYPES.MissingHandler)
      .to(BinanceMissingHandler)
      .inSingletonScope();

    bind<IExchangeInfoService>(TYPES.ExchangeInfoService)
      .to(BinanceExchangeInfoService)
      .inSingletonScope();

    bind<IBinanceUtils>(TYPES.BinanceUtils)
      .to(BinanceUtils)
      .inSingletonScope();

    bind<IPlatformApiFetcher>(TYPES.PlatformApiFetcher)
      .to(BinanceApiFetcher)
      .inSingletonScope();

    bind<boolean>(TYPES.IsBinanceFutures)
      .toConstantValue(isBinanceFutures);

    platformSpecs = {
      name: TradingPlatformName.BINANCE,
      useBigIntForId: false,
      incrementalTradeId: true,
      showVolRank: !isBinanceFutures,
      showPriceRank: !isBinanceFutures,
      addTradingViewLink: !isBinanceFutures,
      showPriceDiffInNotifications: isBinanceFutures,
      reportIntervalClose: isBinanceFutures,
      checkTimeForVolumeInquiries: false,
      telegramChartBy: isBinanceFutures ? '@BinanceFuturesTracker' : '@WhaleTracker_Bot',
      twitterChartBy: isBinanceFutures ? '@FuturesTracker' : '',
      openInterestServiceEnabled: isBinanceFutures,
      filterIntervalClosingAlert: (symbol, interval, dest) => {
        if (dest !== 'telegram') {
          return true;
        }
        // filter out 1h closing reports
        if (interval === '1h') {
          return false;
        }
        // filter out 4h closing reports for all symbols except BTCUSDT
        if (interval === '4h' && symbol !== 'btcusdt') {
          return false;
        }
        return true;
      },
      filterWatcherSymbol: (watcherId, symbol) => {
        const priceChangeWatcherIds = [
          TRADE_WATCHER_IDS.PRICE_CHANGE_SPIKE,
          TRADE_WATCHER_IDS.PRICE_CHANGE_DROP,
        ];
        const isPriceDropSpikeWatcher = priceChangeWatcherIds.includes(watcherId);
        // enable buy/sell alerts only for BTCUSDT for Binance-Futures
        if (isBinanceFutures && !isPriceDropSpikeWatcher) {
          return ['btcusdt'].includes(symbol);
        }
        return true;
      },
      formatPairUrl(coin: string, market: string): string {
        return `https://www.binance.com/en/${isBinanceFutures ? 'futures' : 'trade'}/${coin.toUpperCase()}${isBinanceFutures ? '' : '_'}${market.toUpperCase()}`;
      },
    };
  }
  if (platformSpecs != null) {
    bind<IPlatformSpecs>(TYPES.PlatformSpecs)
      .toConstantValue(platformSpecs);
  }

  bind<ISocketsManager>(TYPES.SocketsManager)
    .to(SocketsManager)
    .inSingletonScope();


  bind<ISocketDataHandler>(TYPES.SocketDataHandler)
    .to(SocketDataHandler)
    .inSingletonScope();

  bind<ISocketIOManager>(TYPES.SocketIOManager)
    .to(SocketIOManager)
    .inSingletonScope();

  bind<ISaveTradesListener>(TYPES.SaveTradesListener)
    .toDynamicValue(context => ({
      onSave(symbol: string, trades: AggregatedTrades[]): void {
        const socketIOManager = context.container.get<ISocketIOManager>(TYPES.SocketIOManager);
        socketIOManager.updateStreamData(symbol, {}, trades);
      },
    }));

  bind<DatabaseNamespace.IDatabase>(TYPES.Database)
    .to(Database)
    .inSingletonScope();

  bind<ICandles>(TYPES.Candles)
    .to(Candles)
    .inSingletonScope();

  bind<ICandlesAnalysis>(TYPES.CandlesAnalysis)
    .to(CandlesAnalysis)
    .inSingletonScope();

  bind<ITradeWatcher>(TYPES.TradeWatcher)
    .to(TradeWatcher)
    .inSingletonScope();

  bind<IWatcherFactory>(TYPES.WatcherFactory)
    .to(WatcherFactory)
    .inSingletonScope();

  bind<IAlertFormatter>(TYPES.AlertFormatter)
    .to(BaseAlertFormatter)
    .inSingletonScope()
    .whenTargetNamed(IAlertFormatterType.BASE);

  bind<IOrderBook>(TYPES.OrderBook)
    .to(OrderBook)
    .inSingletonScope();

  bind<interfaces.Factory<IAlertFormatter>>(TYPES.AlertFormatterFactory)
    .toFactory<IAlertFormatter>((context: interfaces.Context) => (key: IAlertFormatterType) => context.container.getNamed<IAlertFormatter>(TYPES.AlertFormatter, key));

  bind<IWatcherOptionsFactory>(TYPES.WatcherOptionsFactory)
    .toFactory<Required<IWatcherOptions>>(() => (id: TRADE_WATCHER_IDS): Required<IWatcherOptions> => {
    const options: Required<IWatcherOptions> = {
      timeout: 45 * 60 * 1000,
      btcQuantityThreshold: getEnvNumber('UNUSUAL_ALERT_QUANTITY_THRESHOLD'),
      nonBtcQuantityThreshold: getEnvNumber('UNUSUAL_ALERT_QUANTITY_THRESHOLD_NON_BTC'),
      quantityPercentThreshold: getEnvNumber('UNUSUAL_ALERT_QUANTITY_PERCENT_THRESHOLD'),
      priceChangeThreshold: 0,
      priceOrQuantity: false,
    };
    switch (id) {
      case TRADE_WATCHER_IDS.BUY:
        options.priceChangeThreshold = getEnvNumber('UNUSUAL_BUY_ALERT_PRICE_CHANGE_PERCENT_THRESHOLD');
        // if (isBinanceFutures) {
        //   options.priceOrQuantity = true;
        // }
        break;
      case TRADE_WATCHER_IDS.SELL:
        options.priceChangeThreshold = getEnvNumber('UNUSUAL_SELL_ALERT_PRICE_CHANGE_PERCENT_THRESHOLD');
        // if (isBinanceFutures) {
        //   options.priceOrQuantity = true;
        // }
        break;
      case TRADE_WATCHER_IDS.VOLUME:
        options.priceChangeThreshold = getEnvNumber('UNUSUAL_ALERT_PRICE_CHANGE_PERCENT_THRESHOLD');
        break;
      case TRADE_WATCHER_IDS.PRICE_CHANGE_SPIKE:
        options.priceChangeThreshold = getEnvNumber('PRICE_CHANGE_ALERT_PERCENT_THRESHOLD');
        break;
      case TRADE_WATCHER_IDS.PRICE_CHANGE_DROP:
        options.priceChangeThreshold = getEnvNumber('PRICE_CHANGE_ALERT_PERCENT_THRESHOLD');
        break;
      default:
        break;
    }
    return options;
  });

  bind<IIntervalCloseWatcher>(TYPES.IntervalCloseWatcher)
    .to(IntervalCloseWatcher)
    .inSingletonScope();

  bind<IBotsManager>(TYPES.BotsManager)
    .to(BotsManager)
    .inSingletonScope();

  bind<IPlotCreator>(TYPES.PlotCreator)
    .to(PlotCreator)
    .inSingletonScope();

  bind<IPairUserWatchers>(TYPES.PairUserWatchers)
    .to(PairUserWatchers)
    .inSingletonScope();

  bind<IBotCommandHandler>(TYPES.PriceDetailsCommandHandler)
    .toConstantValue(priceDetailsCommand.handler);

  bind<ITelegrafWrapperFactory>(TYPES.TelegrafWrapperFactory)
    .toFactory(context => {
      return (token: string, type: BOT_IDS) => {
        const schedulerFactory = context.container.get<ISchedulerFactory>(TYPES.SchedulerFactory);
        return new TelegrafWrapper(token, type, schedulerFactory);
      };
    });

  bind<IOpenInterestService>(TYPES.OpenInterestService)
    .to(OpenInterestService)
    .inSingletonScope();
});

container.load(applicationDependencies, commonContainerModule);

const database = container.get<DatabaseNamespace.IDatabase>(TYPES.Database);

export { container, database };
