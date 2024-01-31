import RedisHandler from '../config/redis';
declare class ThirdPartyService {
    static redisHandler: RedisHandler;
    static getStockHistorical: (code: string, today: string) => Promise<any>;
    static getBoard: () => Promise<any>;
}
export default ThirdPartyService;
