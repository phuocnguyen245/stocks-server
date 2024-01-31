declare const pickKeysInObject: <T extends object, K extends keyof T>({ object, keys }: {
    object: T;
    keys: K[];
}) => Pick<T, K>;
declare const generateKey: () => string;
declare const dateStringToNumber: (dateString: string) => number;
declare const convertToDecimal: (value: string | number, decimal?: number) => number;
declare const countDays: (startDate: string, endDate?: string) => number;
export { pickKeysInObject, generateKey, dateStringToNumber, convertToDecimal, countDays };
