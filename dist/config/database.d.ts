declare class MongoDatabase {
    private static instance;
    private constructor();
    private connect;
    static getInstance(): MongoDatabase;
}
export declare const instanceMongodb: MongoDatabase;
export {};
