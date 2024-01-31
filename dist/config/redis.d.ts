import { RedisClientType } from 'redis';
declare class RedisHandler {
    redis: RedisClientType;
    constructor();
    save: (key: string, value: unknown) => Promise<string | null>;
    get: (key: string) => Promise<any>;
    setExpired: (key: string, expired: number) => Promise<void>;
    removeKey: (key: string) => Promise<void>;
    removeKeys: (key: string) => Promise<void>;
    removeAll: () => Promise<void>;
    getAllKeys: (key: string) => Promise<string[]>;
}
export default RedisHandler;
