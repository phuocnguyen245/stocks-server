import { Response } from "express";
declare class SuccessResponse {
    statusCode: number;
    subMessage?: string;
    message?: string;
    data: any;
    constructor({ message, statusCode, subMessage, data, }: {
        message?: string;
        statusCode: number;
        subMessage?: string;
        data?: any;
    });
    send(res: Response): Response<any, Record<string, any>>;
}
declare class OK extends SuccessResponse {
    constructor({ message, data }: {
        message?: string;
        data?: any;
    });
}
declare class CREATED extends SuccessResponse {
    constructor({ message, data }: {
        message?: string;
        data?: any;
    });
}
declare class UPDATED extends SuccessResponse {
    constructor({ message, data }: {
        message?: string;
        data?: any;
    });
}
declare class DELETED extends SuccessResponse {
    constructor({ message, data }: {
        message?: string;
        data?: any;
    });
}
export { OK, CREATED, UPDATED, DELETED };
