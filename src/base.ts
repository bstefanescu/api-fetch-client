import { buildQueryString, join, removeTrailingSlash } from "./utils.js";

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

    /**
     * You can customize the json parser by overriding this method
     * @param text 
     * @returns 
     */
    jsonParse(text: string) {
        return JSON.parse(text);
    }

    /**
     * Can be overridden to do something with the request before sending it
     * @param fetch 
     * @param url 
     * @param init 
     * @returns 
     */
    handleRequest(fetch: FETCH_FN, url: string, init: RequestInit) {
        return fetch(url, init);
    }

    async resolveJSONPayload(res: Response) {
        return res.text().then(text => {
            if (!text) {
                return undefined;
            } else {
                try {
                    return this.jsonParse(text);
                } catch (err: any) {
                    return {
                        status: res.status,
                        error: "Not a valid JSON payload",
                        message: err.message,
                        text: text,
                    };
                }
            }
        }).catch((err) => {
            return {
                status: res.status,
                error: "Unable to load repsonse content",
                message: err.message,
            };
        });
    }

    /**
     * Subclasses You can override this to do something with the response
     * @param res 
     */
    handleResponse(res: Response, url: string) {
        return this.resolveJSONPayload(res).then((payload) => {
            if (res.ok) {
                return payload;
            } else {
                throw new ServerError(res.status, payload);
            }
        });
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
        return this._fetch.then(fetch => this.handleRequest(fetch, url, init).catch(err => {
            console.error(`Failed to connect to ${url}`, err);
            throw new ServerError(0, err);
        }).then(res => {
            return this.handleResponse(res, url);
        }));
    }
}
