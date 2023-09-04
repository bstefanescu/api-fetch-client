import assert from "assert";
import { FetchClient } from '../src';
import { KoaServer } from '@koa-stack/server';
import Endpoints from './endpoints';

const PORT = 7777;
const server = new KoaServer();

server.mount('/api/v1', Endpoints)

before(() => {
    server.start(PORT);
});

after(() => {
    server.stop();
});

const client = new FetchClient(`http://localhost:${PORT}/api/v1`).withHeaders({
    "authorization": "Bearer 1234"
});

describe('Test requests', () => {
    it('get method works', done => {
        client.get('/').then((payload: any) => {
            assert(payload.message, "Hello World!");
            done();
        }).catch(done);
    });
    it('withHeaders works', done => {
        client.get('/token').then((payload: any) => {
            assert(payload.token, "1234");
            done();
        }).catch(done);
    });
});


