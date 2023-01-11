import type { TypedResponse as RemixTypedResponse } from "@remix-run/node";

type TypedResponse<ResponseType> = Awaited<
  ReturnType<RemixTypedResponse<ResponseType>["json"]>
>;

import type {
  ApiRequest,
  InferRequest,
  InferResponse,
  InferUrl,
} from "../types";

export const fetchAction = async <
  T extends (ctx: ApiRequest) => Promise<TypedResponse<ReturnType<T>>>
>(
  url: InferUrl<T>,
  request: InferRequest<T>
): Promise<InferResponse<T>> => {
  const response = await fetch(String(url), {
    body: JSON.stringify(request),
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });

  const body: InferResponse<T> = await response.json();

  if (response.status !== 200) {
    throw new Error(String(body));
  }

  return body;
};
