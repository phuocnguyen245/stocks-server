declare class Indicator {
    data: number[][];
    static data: number[][];
    result: any;
    static result: any;
    constructor({ data }: {
        data: number[][];
    });
    static calculateEMA: (data: number[], period: number) => number[];
    static calculateMA: (prices: number[], size: number) => number[];
    static calculateMFI: (data: number[][], period: number) => number[];
    static calculateRSI: (data: number[], period: number) => number[];
    static calculateStochasticK: (prices: number[][], period: number) => number[];
    static calculateStochasticD: (stochasticKValues: number[], smaPeriod: number) => number[];
    static calculateStochasticRSI: (rsiValues: number[], period: number) => number[];
    static MACD: (data: number[], sortPeriod: number | undefined, longPeriod: number | undefined, signalPeriod: 9) => {
        macd: number[];
        signal: number[];
    };
    static MA: (data: number[]) => {
        ma10: number[];
        ma20: number[];
        ma50: number[];
        ma100: number[];
        ma150: number[];
        ma200: number[];
    };
    static MFI: (data: number[][], period?: number) => {
        mfi: number[];
    };
    static RSI: (data: number[], period?: number) => {
        rsi: number[];
    };
    static STOCH: (data: number[][], period?: number) => {
        stoch: {
            k: number[];
            d: number[];
        };
    };
    static STOCH_RSI: (rsi: number[], period?: number, sma?: number) => {
        stoch: {
            k: number[];
            d: number[];
        };
    };
    getResult: () => {
        macd: {
            macd: number[];
            signal: number[];
        };
        ma: {
            ma10: number[];
            ma20: number[];
            ma50: number[];
            ma100: number[];
            ma150: number[];
            ma200: number[];
        };
        mfi: number[];
        rsi: number[];
        stoch: {
            k: number[];
            d: number[];
        };
        stochRSI: {
            k: number[];
            d: number[];
        };
        result: {
            macd: {
                macd: number;
                signal: number;
            };
            mfi: number;
            rsi: number;
            stoch: {
                k: number;
                d: number;
            };
            stochRSI: {
                k: number;
                d: number;
            };
            ma: {
                ma10: number;
                ma20: number;
                ma50: number;
                ma100: number;
                ma150: number;
                ma200: number;
            };
        };
    };
}
export default Indicator;
