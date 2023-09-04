
import { Resource, get } from "@koa-stack/router";
import { Context } from "koa";

export default class Endpoints extends Resource {

    @get("/")
    async getRoot(ctx: Context) {
        return { message: "Hello World" };
    }

    @get("/token")
    async getAuthToken(ctx: Context) {
        const token = (ctx.headers.authorization as string).split(" ")[1];
        return { token };
    }

}

