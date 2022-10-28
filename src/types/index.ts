import { DataFunctionArgs, TypedResponse } from "@remix-run/node";
import zod, { Schema, ZodSchema } from "zod";

export type GetFirstArgument<T> = T extends (
  first: infer FirstArgument,
  ...args: any[]
) => any
  ? FirstArgument
  : never;

export type HandlerDefinition<RequestBody, ResponseType, Ctx, Url> = {
  url: Url;
  fn: (
    data: RequestBody,
    ctx: HandlerContext<ContextResult<Ctx>>
  ) => Promise<ResponseType>;
  schema?: ZodSchema<RequestBody>;
  ctx?: Ctx;
};

export type HandlerContext<T = {}> = T & DataFunctionArgs;

export type ContextResult<Ctx> = {
  [key in keyof Ctx]: Ctx[key] extends (ctx: HandlerContext) => infer ReturnTpe
    ? Awaited<ReturnTpe>
    : never;
};

export interface ApiRequest<T = any, E = any> extends DataFunctionArgs {
  request: Request & { json: () => Promise<T> };
  endpoint: E;
}

export type InferSchema<T extends Schema> = zod.infer<T>;

export type InferRequest<
  T extends (ctx: ApiRequest) => Promise<TypedResponse<ReturnType<T>>>
> = GetFirstArgument<T> extends ApiRequest<infer T, any> ? T : never;

export type InferResponse<
  T extends (ctx: ApiRequest) => Promise<TypedResponse<ReturnType<T>>>
> = Awaited<ReturnType<T>> extends TypedResponse<infer T> ? T : never;

export type InferUrl<
  T extends (ctx: ApiRequest) => Promise<TypedResponse<ReturnType<T>>>
> = GetFirstArgument<T> extends ApiRequest<any, infer E> ? E : never;

export type ApiFunction = (...args: any[]) => any;
export type QueryResult<F extends ApiFunction> = Awaited<ReturnType<F>>;
export type QueryArrayResult<F extends ApiFunction> = QueryResult<F>[number];
