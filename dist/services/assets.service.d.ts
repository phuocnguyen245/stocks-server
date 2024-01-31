declare class AssetsService {
    static getAsset: (userId: string) => Promise<{
        payment: any;
        stock: {
            order: number;
            sell: number;
            waiting: number;
        };
    }>;
}
export default AssetsService;
