import type { TypedResponse as RemixTypedResponse } from "@remix-run/node";

type TypedResponse<ResponseType> = Awaited<
  ReturnType<RemixTypedResponse<ResponseType>["json"]>
>;

import { useState } from "react";
import type {
  ApiRequest,
  InferRequest,
  InferResponse,
  InferUrl,
} from "../types";

export const action = async <
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

export const useAction = <
  T extends (ctx: ApiRequest<any, any>) => Promise<Awaited<ReturnType<T>>>
>(
  url: InferUrl<T>
) => {
  const [isLoading, setIsLoading] = useState(false);

  const [request, setRequest] = useState<InferRequest<T> | null>(null);

  const [response, setResponse] = useState<InferResponse<T> | null>(null);

  const fn = async (request: InferRequest<T>) => {
    setIsLoading(true);

    setRequest(request);

    return action<T>(url, request)
      .then((res) => {
        setResponse(res);
        return res;
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  fn.isLoading = isLoading;
  fn.request = request;
  fn.response = response;

  return fn;
};
