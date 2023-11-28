import type { TypedResponse as RemixTypedResponse } from "@remix-run/node";

import { useRevalidator } from "@remix-run/react";

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

interface ActionOptions {
  revalidate?: boolean;
}

export const action = async <
  T extends (ctx: ApiRequest) => Promise<TypedResponse<ReturnType<T>>>
>(
  url: InferUrl<T>,
  request: InferRequest<T>,
  options?: Pick<RequestInit, "signal">
): Promise<InferResponse<T>> => {
  const response = await fetch(String(url), {
    body: JSON.stringify(request),
    method: "POST",
    signal: options?.signal,
    headers: { "Content-Type": "application/json" },
  });

  const body: InferResponse<T> = await response.json();

  if (response.status !== 200) {
    throw new Error(JSON.stringify(body));
  }

  return body;
};

export const useAction = <
  T extends (ctx: ApiRequest<any, any>) => Promise<Awaited<ReturnType<T>>>
>(
  url: InferUrl<T>,
  options = {} as ActionOptions
) => {
  const [isLoading, setIsLoading] = useState(false);

  const [request, setRequest] = useState<InferRequest<T> | null>(null);

  const [response, setResponse] = useState<InferResponse<T> | null>(null);

  const [error, setError] = useState<string | null>(null);

  const { revalidate } = useRevalidator();

  const fn = async (request: InferRequest<T>) => {
    setIsLoading(true);
    setRequest(request);
    setError(null);

    return action<T>(url, request)
      .then((res) => {
        setResponse(res);

        if (options.revalidate) {
          revalidate();
        }

        return res;
      })
      .catch((err: Error) => {
        setError(err.message);
        throw err;
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  fn.isLoading = isLoading;
  fn.request = request;
  fn.response = response;
  fn.error = error;

  return fn;
};
