import { buildQueryString, join, removeTrailingSlash } from "./utils";

export type FETCH_FN = (input: RequestInfo, init?: RequestInit) => Promise<Response>;
type IPrimitives = string | number | boolean | null | undefined | string[] | number[] | boolean[];

export interface IRequestParams {
    query?: Record<string, IPrimitives> | null;
    headers?: Record<string, string> | null;
}

export interface IRequestParamsWithPayload extends IRequestParams {
    payload?: object | string | null
}

export function fetchPromise(fetchImpl?: FETCH_FN | Promise<FETCH_FN>) {
    if (fetchImpl) {
        return Promise.resolve(fetchImpl);
    } else if (typeof globalThis.fetch === 'function') {
        return Promise.resolve(globalThis.fetch);
    } else {
        // install an error impl
        return Promise.resolve(() => {
            throw new Error('No Fetch implementation found')
        });
    }
}

function createMessage(status: number, payload: any) {
    if (payload && payload.message) {
        return String(payload.message);
    } else {
        return 'Server Error: ' + status;
    }
}

export class ServerError extends Error {
    status: number;
    payload: any;
    constructor(status: number, payload: any) {
        super(createMessage(status, payload));
        //super('Server Error: ' + status);
        //super(payload && payload.message ? payload.message : 'Server Error: ' + status);
        this.status = status;
        this.payload = payload;
    }
}

export abstract class ClientBase {

    _fetch: Promise<FETCH_FN>;
    baseUrl: string;
    abstract get headers(): Record<string, string>;

    constructor(baseUrl: string, fetchImpl?: FETCH_FN | Promise<FETCH_FN>) {
        this.baseUrl = removeTrailingSlash(baseUrl);
        this._fetch = fetchPromise(fetchImpl);
    }

    getUrl(path: string) {
        return removeTrailingSlash(join(this.baseUrl, path));
    }

    get(path: string, params?: IRequestParams) {
        return this.request('GET', path, params);
    }

    del(path: string, params?: IRequestParams) {
        return this.request('DELETE', path, params);
    }

    delete(path: string, params?: IRequestParams) {
        return this.request('DELETE', path, params);
    }

    post(path: string, params?: IRequestParamsWithPayload) {
        return this.request('POST', path, params);
    }

    put(path: string, params?: IRequestParamsWithPayload) {
        return this.request('PUT', path, params);
    }

    onRequest(init: RequestInit) {
        // do nothing
    }

    async request(method: string, path: string, params?: IRequestParamsWithPayload) {
        let url = this.getUrl(path);
        if (params?.query) {
            url += '?' + buildQueryString(params.query);
        }
        const headers = this.headers ? Object.assign({}, this.headers) : {};
        const paramsHeaders = params?.headers;
        if (paramsHeaders) {
            for (const key in paramsHeaders) {
                headers[key.toLowerCase()] = paramsHeaders[key];
            }
        }
        const init: RequestInit = {
            method: method,
            headers: headers
        }
        const payload = params?.payload;
        if (payload) {
            init.body = (typeof payload !== 'string') ? JSON.stringify(payload) : payload;
            if (!('content-type' in headers)) {
                headers['content-type'] = 'application/json';
            }
        }
        // patch the request if needed
        await this.onRequest(init);
        return this._fetch.then(fetch => fetch(url, init).catch(err => {
            console.error(`Failed to connect to ${url}`, err);
            throw new ServerError(0, err);
        }).then(res => {
            const payload = res.json().catch(err => {
                console.error(`Failed to parse response from ${url}`, err);
                throw new ServerError(0, err);
            });
            if (res.ok) {
                return payload;
            } else {
                return payload.then(resolvedPayload => {
                    throw new ServerError(res.status, resolvedPayload);
                })
            }
        }));
    }
}
