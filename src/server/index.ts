import type { DataFunctionArgs, TypedResponse } from "@remix-run/node";
import { json } from "@remix-run/node";
import zod from "zod";
import type {
  ApiRequest,
  ContextResult,
  HandlerContext,
  HandlerDefinition,
  InferRequest,
  InferResponse,
  InferUrl,
} from "../types";

export class HTTPError extends Error {
  constructor(public message: string, public status: number) {
    super(message);
  }
}

export const createHandler = <
  RequestBody,
  ResponseType,
  Url extends string,
  Ctx extends {
    [key: string]: (ctx: HandlerContext) => any;
  }
>({
  fn,
  schema,
  ctx,
  url,
}: HandlerDefinition<RequestBody, ResponseType, Ctx, Url>) => {
  const validate = (data: RequestBody) => {
    try {
      return schema ? schema.parse(data) : zod.any().parse(data);
    } catch (err) {
      throw new HTTPError("Input validation error", 404);
    }
  };

  const buildContext = async (remixContext: DataFunctionArgs) => {
    const contextResult = {} as Record<keyof Ctx, any>;

    await Promise.all(
      Object.entries(ctx || {}).map(async ([key, fn]) => {
        const result = await fn(remixContext);

        contextResult[key as keyof Ctx] = result;
      })
    );

    return { ...remixContext, ...contextResult };
  };

  const getResult = async (
    remixContent: HandlerContext,
    fn: (
      data: RequestBody,
      ctx: HandlerContext<ContextResult<Ctx>>
    ) => Promise<ResponseType>
  ) => {
    const validatedData = validate(await remixContent.request.json());

    const handlerCtx = await buildContext(remixContent);

    return fn(validatedData, handlerCtx);
  };

  const handler = async (
    remixContent: ApiRequest<RequestBody, Url>
  ): Promise<TypedResponse<ResponseType>> => {
    const { request } = remixContent;

    if (request.method !== "POST") {
      return json(
        { error: "Must use POST" },
        {
          status: 400,
        }
      );
    }

    return getResult(remixContent, fn)
      .then((result) => {
        return json(result);
      })
      .catch((err) => {
        if (err instanceof HTTPError) {
          const message = err.message;
          const code = err.status;

          return json(
            { error: message },
            {
              status: code,
            }
          );
        }

        throw err;
      });
  };

  return handler;
};

const handler = createHandler({
  url: "/text",
  async fn(data, ctx) {
    return new Date();
  },
  schema: zod.object({ hello: zod.string() }),
});

type Handler = typeof handler;

type Response = InferResponse<Handler>;

type Url = InferUrl<Handler>;

type Request = InferRequest<Handler>;
