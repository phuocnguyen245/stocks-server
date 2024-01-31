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
import { Types } from 'mongoose';
import { User } from '../types/types.js';
declare class UserService {
    static verifyPassword: (inputPassword: string, storedPasswordHash: string) => boolean;
    static hashPassword: (password: string) => string;
    static getAll: () => Promise<(import("mongoose").FlattenMaps<User> & {
        _id: Types.ObjectId;
    })[]>;
    static getByIdOrUsername: (payload: string) => Promise<(import("mongoose").FlattenMaps<User> & {
        _id: Types.ObjectId;
    }) | null>;
    static remove: (id: string) => Promise<void>;
    static create: (body: User) => Promise<User & {
        _id: Types.ObjectId;
    } & Required<{
        _id: Types.ObjectId;
    }>>;
    static register: (body: User) => Promise<{
        tokens: {
            access: string;
            refresh: string;
        };
        name: string;
        username: string;
        password: string;
        isDeleted: boolean;
        _id: Types.ObjectId;
    }>;
    static login: ({ username, password }: {
        username: string;
        password: string;
    }) => Promise<{
        tokens: {
            access: string;
            refresh: string;
        };
        name: string;
        username: string;
        password: string;
        isDeleted: boolean;
        _id: Types.ObjectId;
    }>;
}
export default UserService;
