export interface ApiRequestOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  headers?: Record<string, string>;
  body?: any;
  timeout?: number;
}

export async function apiRequest(
  url: string,
  options: ApiRequestOptions = {},
): Promise<Response> {
  const { method = "GET", headers = {}, body, timeout = 30000 } = options;

  let lastError: Error | null = null;

  // Retry up to 3 times with exponential backoff
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      // Use XMLHttpRequest first to avoid FullStory interference
      const response = await attemptXMLHttpRequest(
        url,
        method,
        headers,
        body,
        timeout,
      );
      return response; // Success, return immediately
    } catch (xhrError) {
      console.log(
        `apiClient: XMLHttpRequest attempt ${attempt} failed for ${url}, trying fetch fallback`,
      );

      try {
        // Fallback to fetch
        const response = await attemptFetch(url, method, headers, body);
        return response; // Success, return immediately
      } catch (fetchError) {
        lastError = new Error(
          `Attempt ${attempt} failed - XHR: ${(xhrError as Error).message}, Fetch: ${(fetchError as Error).message}`,
        );

        if (attempt < 3) {
          // Wait before retry with exponential backoff
          const delay = Math.pow(2, attempt - 1) * 1000; // 1s, 2s, 4s
          console.log(
            `apiClient: Attempt ${attempt} failed, retrying in ${delay}ms...`,
          );
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }
  }

  // All attempts failed
  console.error(`apiClient: All attempts failed for ${url}:`, lastError);
  throw new Error(
    `Failed to ${method} ${url}: All request methods failed after 3 attempts`,
  );
}

async function attemptXMLHttpRequest(
  url: string,
  method: string,
  headers: Record<string, string>,
  body: any,
  timeout: number,
): Promise<Response> {
  const xhr = new XMLHttpRequest();
  xhr.open(method, url, true);
  xhr.withCredentials = true;

  // Set headers
  xhr.setRequestHeader("Content-Type", "application/json");
  Object.entries(headers).forEach(([key, value]) => {
    xhr.setRequestHeader(key, value);
  });

  return new Promise<Response>((resolve, reject) => {
    xhr.onload = () => {
      const responseText = xhr.responseText;
      resolve({
        ok: xhr.status >= 200 && xhr.status < 300,
        status: xhr.status,
        statusText: xhr.statusText,
        json: () => {
          try {
            return Promise.resolve(JSON.parse(responseText));
          } catch (e) {
            return Promise.reject(new Error("Invalid JSON response"));
          }
        },
        text: () => Promise.resolve(responseText),
        headers: new Headers(),
        url: url,
        redirected: false,
        type: "basic",
        clone: () => {
          throw new Error(
            "Response.clone() not supported in XMLHttpRequest fallback",
          );
        },
        body: null,
        bodyUsed: false,
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
        blob: () => Promise.resolve(new Blob()),
        formData: () => Promise.resolve(new FormData()),
      } as Response);
    };
    xhr.onerror = () => reject(new Error("XMLHttpRequest network error"));
    xhr.ontimeout = () => reject(new Error("XMLHttpRequest timeout"));
    xhr.timeout = timeout;

    if (body && method !== "GET") {
      xhr.send(JSON.stringify(body));
    } else {
      xhr.send();
    }
  });
}

async function attemptFetch(
  url: string,
  method: string,
  headers: Record<string, string>,
  body: any,
): Promise<Response> {
  const fetchOptions: RequestInit = {
    method,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    credentials: "include",
  };

  if (body && method !== "GET") {
    fetchOptions.body = JSON.stringify(body);
  }

  return await fetch(url, fetchOptions);
}

// Convenience methods
export const apiGet = (
  url: string,
  options?: Omit<ApiRequestOptions, "method">,
) => apiRequest(url, { ...options, method: "GET" });

export const apiPost = (
  url: string,
  body?: any,
  options?: Omit<ApiRequestOptions, "method" | "body">,
) => apiRequest(url, { ...options, method: "POST", body });

export const apiPut = (
  url: string,
  body?: any,
  options?: Omit<ApiRequestOptions, "method" | "body">,
) => apiRequest(url, { ...options, method: "PUT", body });

export const apiDelete = (
  url: string,
  options?: Omit<ApiRequestOptions, "method">,
) => apiRequest(url, { ...options, method: "DELETE" });
