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
import mongoose, { Types } from 'mongoose';
import { Stock, type CurrentStock, PagePagination } from '../types/types.js';
import RedisHandler from '../config/redis.ts';
declare class CurrentStockService {
    static redisHandler: RedisHandler;
    static getCurrentStocks: (pagination: PagePagination<CurrentStock>) => Promise<{
        data: any[];
        page: number;
        size: number;
        totalItems: number;
    }>;
    static getCurrentStockByCode: (code: string, userId: string) => Promise<(mongoose.FlattenMaps<CurrentStock> & {
        _id: Types.ObjectId;
    }) | null>;
    static createCurrentStock: (body: CurrentStock, userId: string, session?: mongoose.mongo.ClientSession) => Promise<CurrentStock & {
        _id: Types.ObjectId;
    } & Required<{
        _id: Types.ObjectId;
    }>>;
    static updateCurrentStock: (code: string, body: CurrentStock, userId: string, session?: mongoose.mongo.ClientSession) => Promise<(CurrentStock & {
        _id: Types.ObjectId;
    } & Required<{
        _id: Types.ObjectId;
    }>) | undefined>;
    static removeCurrentStock: (code: string, userId: string, session?: mongoose.mongo.ClientSession) => Promise<(mongoose.Document<unknown, {}, CurrentStock> & CurrentStock & {
        _id: Types.ObjectId;
    }) | null>;
    static convertBodyToCreate: (stock: Stock, foundCurrentStock: CurrentStock | null, endOfDayPrice: number, isBuy: boolean, userId: string, session?: mongoose.mongo.ClientSession) => Promise<(CurrentStock & {
        _id: Types.ObjectId;
    } & Required<{
        _id: Types.ObjectId;
    }>) | undefined>;
    static convertBodyToUpdate: (oldStock: Stock, body: Stock, endOfDayPrice: number, isBuy: boolean, userId: string) => Promise<CurrentStock | null>;
    static updateRemoveStock: (stock: Stock, userId: string, session: mongoose.mongo.ClientSession) => Promise<(CurrentStock & {
        _id: Types.ObjectId;
    } & Required<{
        _id: Types.ObjectId;
    }>) | null | undefined>;
    static updateCurrentStockByDay: (code: string, marketPrice: number, userId: string) => Promise<(CurrentStock & {
        _id: Types.ObjectId;
    } & Required<{
        _id: Types.ObjectId;
    }>) | undefined>;
}
export default CurrentStockService;
