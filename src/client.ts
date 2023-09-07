import { ClientBase, FETCH_FN } from "./base";


export class AbstractFetchClient<T extends AbstractFetchClient<T>> extends ClientBase {

    headers: Record<string, string>;

    constructor(baseUrl: string, fetchImpl?: FETCH_FN | Promise<FETCH_FN>) {
        super(baseUrl, fetchImpl);
        this.baseUrl = baseUrl[baseUrl.length - 1] === '/' ? baseUrl.substring(0, baseUrl.length - 1) : baseUrl;
        this.headers = this.initialHeaders;
    }

    get initialHeaders() {
        return { accept: 'application/json' };
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

}

export class FetchClient extends AbstractFetchClient<FetchClient> {

    constructor(baseUrl: string, fetchImpl?: FETCH_FN | Promise<FETCH_FN>) {
        super(baseUrl, fetchImpl);
    }

}

export default abstract class ApiTopic extends ClientBase {

    constructor(public client: ClientBase, basePath: string) {
        super(client.getUrl(basePath), client._fetch);
    }

    get headers() {
        return this.client.headers;
    }

}

