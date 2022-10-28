import type { TypedResponse } from "@remix-run/node";
import { useMutation, useQuery } from "react-query";
import type {
  ApiRequest,
  InferRequest,
  InferResponse,
  InferUrl,
} from "../types";

const fetcher = async <
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

const useApiQuery = <
  T extends (ctx: ApiRequest) => Promise<TypedResponse<ReturnType<T>>>
>(
  url: InferUrl<T>,
  request: InferRequest<T>
) => {
  return useQuery([url, request], () => {
    return fetcher<T>(url, request);
  });
};

const useApiMutation = <
  T extends (ctx: ApiRequest) => Promise<TypedResponse<ReturnType<T>>>
>(
  url: InferUrl<T>
) => {
  return useMutation((request: InferRequest<T>) => {
    return fetcher(url, request);
  });
};

export { useApiQuery as useQuery, useApiMutation as useMutation, fetcher };
