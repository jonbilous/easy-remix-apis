import type { DataFunctionArgs, TypedResponse } from "@remix-run/node";
import { json } from "@remix-run/node";
import zod from "zod";
import type {
  ApiRequest,
  ContextResult,
  HandlerContext,
  HandlerDefinition,
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
    return getResult(remixContent, fn)
      .then((result) => {
        const res = json<ResponseType>(result);

        return res;
      })
      .catch((err) => {
        console.error("error in api route", url, err);

        if (err instanceof HTTPError) {
          const message = err.message;
          const code = err.status;

          throw json(
            { error: message },
            {
              status: code,
            }
          );
        } else {
          throw err;
        }
      });
  };

  return handler;
};
