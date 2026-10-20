import { erpGet, erpPost, erpPostForm, clearErpCache } from "@/lib/api-client";

type ApiParams = Record<string, any>;

export { clearErpCache };

export function getFeatureData<T = any>(
  endpoint: string,
  params: ApiParams,
  options?: { skipCache?: boolean; ttlMs?: number }
) {
  return erpGet<T>(endpoint, params, options);
}

export function postFeatureData<T = any>(endpoint: string, params: ApiParams, mode?: string) {
  return erpPost<T>(endpoint, params, mode);
}

export function postFeatureForm<T = any>(endpoint: string, formData: FormData) {
  return erpPostForm<T>(endpoint, formData);
}
