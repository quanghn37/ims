import { erpGet, erpPost, erpPostForm, clearErpCache } from "@/lib/api-client";

type ApiParams = object;

export { clearErpCache };

export function getFeatureData<T = any>(
  endpoint: string,
  params: ApiParams,
  options?: { skipCache?: boolean; ttlMs?: number; timeoutMs?: number }
) {
  return erpGet<T>(endpoint, params as Record<string, unknown>, options);
}

export function postFeatureData<T = any>(endpoint: string, params: ApiParams, mode?: string) {
  return erpPost<T>(endpoint, params as Record<string, unknown>, mode);
}

export function postFeatureForm<T = unknown>(endpoint: string, formData: FormData) {
  return erpPostForm<T>(endpoint, formData);
}
