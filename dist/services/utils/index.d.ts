declare const filterBoardStocks: (arr: any[], pagination: {
    page: number;
    size: number;
    search: string;
}) => {
    data: any[];
    page: number;
    size: number;
    totalItems: number;
};
declare function findDuplicateStocks(arr1: any, arr2: string[]): string[];
export { filterBoardStocks, findDuplicateStocks };
