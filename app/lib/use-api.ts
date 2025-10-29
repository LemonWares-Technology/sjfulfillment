"use client";

import { useState } from "react";
import toast from "react-hot-toast";

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

interface ApiRequestInit extends Omit<RequestInit, 'cache'> {
  silent?: boolean;
  cache?: boolean;
  cacheTTL?: number;
}

export function useApi() {
  const [loading, setLoading] = useState(false);

  const request = async <T = any>(
    url: string,
    options: ApiRequestInit = {}
  ): Promise<T> => {
    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      const { cache, cacheTTL, silent, ...fetchOptions } = options;
      const response = await fetch(url, {
        ...fetchOptions,
        headers: {
          ...(options.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
          ...(token && { Authorization: `Bearer ${token}` }),
          ...fetchOptions.headers,
        },
      });

      let data: ApiResponse<T> | undefined;
      let rawText: string | undefined;
      let isJson = true;
      try {
        rawText = await response.text();
        try {
          data = JSON.parse(rawText);
        } catch (jsonError) {
          isJson = false;
        }
      } catch (streamError) {
        // If even reading the text fails, show a generic error
        throw new Error('Unable to read server response.');
      }

      if (!isJson) {
        if (rawText && rawText.startsWith('<!DOCTYPE')) {
          throw new Error('Server returned HTML instead of JSON. Please check your API endpoint.');
        }
        throw new Error('Invalid response format.');
      }

      if (!response.ok) {
        if (response.status === 401) {
          window.location.href = '/unauthorized';
          throw new Error('Unauthorized');
        }
        throw new Error((data && data.error) || "Request failed");
      }

      if (data && !data.success) {
        throw new Error(data.error || "Request failed");
      }

      return (data && data.data) as T;
    } catch (error) {
      let errorMessage = "An error occurred";
      let isNetworkError = false;
      if (error instanceof TypeError && error.message === "Failed to fetch") {
        errorMessage = "Network error: Unable to reach the server. Please check your connection or try again later.";
        isNetworkError = true;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      console.error("API Error:", errorMessage);

      if (error instanceof Error && error.message.includes('401')) {
        window.location.href = '/unauthorized';
        throw error;
      }

      if (!options.silent) {
        if (isNetworkError && typeof window !== 'undefined') {
          // Dispatch a custom event to show network modal
          window.dispatchEvent(new CustomEvent('network-modal', { detail: { reconnecting: true } }));
        } else {
          toast.error(errorMessage);
        }
      }
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const get = <T = any>(url: string, options?: ApiRequestInit) =>
    request<T>(url, { ...options, method: 'GET' });

  const post = <T = any>(url: string, data?: any) =>
    request<T>(url, {
      method: "POST",
      body: data ? JSON.stringify(data) : undefined,
    });

  const put = <T = any>(url: string, data?: any) =>
    request<T>(url, {
      method: "PUT",
      body: data ? JSON.stringify(data) : undefined,
    });

  const del = <T = any>(url: string) =>
    request<T>(url, {
      method: "DELETE",
    });

  // Alias for backward compatibility
  const callApi = request;

  return {
    loading,
    request,
    callApi, // Added this
    get,
    post,
    put,
    delete: del,
  };
}
