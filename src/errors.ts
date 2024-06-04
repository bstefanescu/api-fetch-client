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
    constructor(message: string, status: number, payload: any) {
        super(message);
        this.status = status;
        this.payload = payload;
    }
}

export class ServerError extends RequestError {
    constructor(status: number, payload: any) {
        super(createMessage(status, payload), status, payload);
    }
}

export class ConnectionError extends RequestError {
    constructor(err: Error) {
        super("Failed to connect to server: " + err.message, 0, err);
    }
}
