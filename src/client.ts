import { ClientBase, FETCH_FN, IRequestParamsWithPayload } from "./base.js";


export class AbstractFetchClient<T extends AbstractFetchClient<T>> extends ClientBase {

    headers: Record<string, string>;
    _auth?: () => Promise<string>;
    // callbacks usefull to log requests and responses
    onRequest?: (url: string, init: RequestInit) => void;
    onResponse?: (res: Response) => void;
    // the last response. Can be used to inspect the response headers
    response?: Response;

    constructor(baseUrl: string, fetchImpl?: FETCH_FN | Promise<FETCH_FN>) {
        super(baseUrl, fetchImpl);
        this.baseUrl = baseUrl[baseUrl.length - 1] === '/' ? baseUrl.substring(0, baseUrl.length - 1) : baseUrl;
        this.headers = this.initialHeaders;
    }

    get initialHeaders() {
        return { accept: 'application/json' };
    }

    /**
     * Install an auth callback. If the callback is undefined or null then remove the auth callback.
     * @param authCb a fucntion returning a promise that resolves to the value to use for the authorization header
     * @returns the client instance
     */
    withAuthCallback(authCb?: (() => Promise<string>) | null) {
        this._auth = authCb || undefined;
        return this;
    }

    withLang(locale: string | undefined | null) {
        if (locale) {
            this.headers['accept-language'] = locale;
        } else {
            delete this.headers['accept-language'];
        }
        return this as unknown as T;
    }

    withHeaders(headers: Record<string, string>) {
        const thisHeaders = this.headers;
        for (const key in headers) {
            const value = headers[key];
            if (value != null) {
                thisHeaders[key.toLowerCase()] = value;
            }
        }
        return this as unknown as T;
    }

    setHeader(key: string, value: string | undefined) {
        if (!value) {
            delete this.headers[key.toLowerCase()];
        } else {
            this.headers[key.toLowerCase()] = value;
        }
    }

    async handleRequest(fetch: FETCH_FN, url: string, init: RequestInit) {
        if (this._auth) {
            const auth = await this._auth();
            if (auth) {
                if (!init.headers) {
                    init.headers = {};
                }
                (init.headers as Record<string, string>)!["authorization"] = auth;
            }
        }
        this.onRequest && this.onRequest(url, init);
        this.response = undefined;
        return super.handleRequest(fetch, url, init);
    }

    async handleResponse(res: Response, url: string, params: IRequestParamsWithPayload | undefined): Promise<any> {
        this.response = res; // store last repsonse
        this.onResponse && this.onResponse(res);
        return super.handleResponse(res, url, params);
    }

}

export class FetchClient extends AbstractFetchClient<FetchClient> {

    constructor(baseUrl: string, fetchImpl?: FETCH_FN | Promise<FETCH_FN>) {
        super(baseUrl, fetchImpl);
    }

}

export abstract class ApiTopic extends ClientBase {

    constructor(public client: ClientBase, basePath: string) {
        super(client.getUrl(basePath), client._fetch);
    }

    handleRequest(fetch: FETCH_FN, url: string, init: RequestInit): Promise<Response> {
        return this.client.handleRequest(fetch, url, init);
    }

    handleResponse(res: Response, url: string, params: IRequestParamsWithPayload | undefined): Promise<any> {
        return this.client.handleResponse(res, url, params);
    }

    get headers() {
        return this.client.headers;
    }

}

