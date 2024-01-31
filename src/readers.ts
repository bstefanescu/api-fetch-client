import { ClientBase } from "./base.js";

export type CustomReader<T = any> = (response: Response) => Promise<T>;
export type RequestReaderType = 'sse' | 'stream' | 'json' | 'text' | 'blob' | 'arrayBuffer' | 'formData' | CustomReader;


export function getRequestReader(client: ClientBase, reader: RequestReaderType) {
    if (typeof reader === 'string') {
        switch (reader) {
            case 'json':
                return (res: Response, client: ClientBase) => client.readJSONPayload(res);
            case 'text':
                return (res: Response) => res.text();
            case 'sse':
                return (res: Response) => res;
            case 'stream':
                return (res: Response) => res.body;
            case 'blob':
                return (res: Response) => res.blob();
            case 'arrayBuffer':
                return (res: Response) => res.arrayBuffer();
            case 'formData':
                return (res: Response) => res.formData();
            default:
                return (res: Response) => res;
        }
    } else {
        return reader;
    }
}