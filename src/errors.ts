function createMessage(status: number, payload: any) {
    if (payload && payload.message) {
        return String(payload.message);
    } else {
        return 'Server Error: ' + status;
    }
}

export class RequestError extends Error {
    status: number;
    payload: any;
    request: Request;
    details?: string;
    constructor(message: string, request: Request, status: number, payload: any) {
        super(message);
        this.request = request;
        this.status = status;
        this.payload = payload;
        this.details = request.method + ' ' + request.url + ' => ' + status;
        if (this.payload.details) {
            this.details += '\nDetails:\n' + this.payload.details;
        }
    }

}

export class ServerError extends RequestError {
    constructor(req: Request, status: number, payload: any) {
        super(createMessage(status, payload), req, status, payload);
    }
}

export class ConnectionError extends RequestError {
    constructor(req: Request, err: Error) {
        super("Failed to connect to server: " + err.message, req, 0, err);
    }
}
