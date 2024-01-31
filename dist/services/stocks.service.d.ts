/// <reference types="mongoose/types/aggregate" />
/// <reference types="mongoose/types/callback" />
/// <reference types="mongoose/types/collection" />
/// <reference types="mongoose/types/connection" />
/// <reference types="mongoose/types/cursor" />
/// <reference types="mongoose/types/document" />
/// <reference types="mongoose/types/error" />
/// <reference types="mongoose/types/expressions" />
/// <reference types="mongoose/types/helpers" />
/// <reference types="mongoose/types/middlewares" />
/// <reference types="mongoose/types/indexes" />
/// <reference types="mongoose/types/models" />
/// <reference types="mongoose/types/mongooseoptions" />
/// <reference types="mongoose/types/pipelinestage" />
/// <reference types="mongoose/types/populate" />
/// <reference types="mongoose/types/query" />
/// <reference types="mongoose/types/schemaoptions" />
/// <reference types="mongoose/types/schematypes" />
/// <reference types="mongoose/types/session" />
/// <reference types="mongoose/types/types" />
/// <reference types="mongoose/types/utility" />
/// <reference types="mongoose/types/validation" />
/// <reference types="mongoose/types/virtuals" />
/// <reference types="mongoose/types/inferschematype" />
import moment from 'moment';
import mongoose, { FilterQuery, Types } from 'mongoose';
import RedisHandler from '../config/redis.ts';
import type { PagePagination, RecommendedFilter, Stock } from '../types/types.js';
declare class StockService {
    static redisHandler: RedisHandler;
    static getBalance: (userId: string) => Promise<number>;
    static checkBalanceBuy: (balance: number, userId: string) => Promise<boolean>;
    static checkBalanceUpdate: (oldBalance: number, balance: number, userId: string) => Promise<boolean>;
    static getExpiredTime: (hour?: number) => number;
    static getFireAntWatchList: () => Promise<any>;
    static getWatchList: () => Promise<any>;
    static getEndOfDayPrice: (code: string) => Promise<number>;
    static getEndOfDayStock: (code: string) => Promise<any>;
    static getAllStocks: (pagination: PagePagination<Stock>, extraFilter?: FilterQuery<Stock>) => Promise<{
        data: (mongoose.FlattenMaps<Stock> & Required<{
            _id: Types.ObjectId;
        }>)[];
        page: number;
        size: number;
        totalItems: number;
    }>;
    static getStockById: (id: string) => Promise<(mongoose.FlattenMaps<Stock> & Required<{
        _id: Types.ObjectId;
    }>) | null>;
    static createStock: (body: Stock, userId: string) => Promise<Stock[] | undefined>;
    static updateStock: (id: string, body: Stock, userId: string) => Promise<(Stock & Required<{
        _id: Types.ObjectId;
    }>) | null | undefined>;
    static removeStock: (id: string, foundStock: Stock, userId: string) => Promise<(mongoose.Document<unknown, {}, Stock> & Stock & Required<{
        _id: Types.ObjectId;
    }>) | null>;
    static getStockStatistics: (code: string) => Promise<any[][]>;
    static getStockBalance: (userId: string) => Promise<{
        order: number;
        sell: number;
        waiting: number;
    }>;
    static getIndicators: (code: string) => Promise<any>;
    static getBoardStocks: (pagination: {
        page: number;
        size: number;
        search: string;
    }) => Promise<{
        data: any[];
        page: number;
        size: number;
        totalItems: number;
    }>;
    static getAllStocksIndicators: () => Promise<any[]>;
    static refreshTime: () => moment.Moment;
    static getAllKeys: () => Promise<string[]>;
    static getRecommended: (filters: RecommendedFilter) => Promise<any[]>;
    static getRefreshTime: () => Promise<any> | moment.Moment;
}
export default StockService;
