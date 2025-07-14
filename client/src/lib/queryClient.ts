import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Default fetcher function for React Query with FullStory compatibility
const defaultFetcher = async (url: string) => {
  let response: Response;

  // Use XMLHttpRequest first to avoid FullStory interference
  try {
    console.log("queryClient: Using XMLHttpRequest for", url);

    const xhr = new XMLHttpRequest();
    xhr.open("GET", url, true);
    xhr.withCredentials = true;
    xhr.setRequestHeader("Content-Type", "application/json");

    response = await new Promise<Response>((resolve, reject) => {
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
          clone: () => response,
          body: null,
          bodyUsed: false,
          arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
          blob: () => Promise.resolve(new Blob()),
          formData: () => Promise.resolve(new FormData()),
        } as Response);
      };
      xhr.onerror = () => reject(new Error("XMLHttpRequest network error"));
      xhr.ontimeout = () => reject(new Error("XMLHttpRequest timeout"));
      xhr.timeout = 10000; // 10 second timeout
      xhr.send();
    });
  } catch (xhrError) {
    console.log("queryClient: XMLHttpRequest failed, trying fetch for", url);

    // Fallback to fetch
    try {
      response = await fetch(url);
    } catch (fetchError) {
      console.error("queryClient: Both XMLHttpRequest and fetch failed:", {
        url,
        xhrError,
        fetchError,
      });
      throw new Error(`Failed to fetch ${url}: All request methods failed`);
    }
  }

  if (!response.ok) {
    throw new Error(`${response.status}: ${response.statusText}`);
  }
  return response.json();
};

// API request helper function with FullStory compatibility
export const apiRequest = async (
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH",
  url: string,
  data?: any,
) => {
  let response: Response;

  // Use XMLHttpRequest first to avoid FullStory interference
  try {
    const xhr = new XMLHttpRequest();
    xhr.open(method, url, true);
    xhr.withCredentials = true;
    xhr.setRequestHeader("Content-Type", "application/json");

    response = await new Promise<Response>((resolve, reject) => {
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
          clone: () => response,
          body: null,
          bodyUsed: false,
          arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
          blob: () => Promise.resolve(new Blob()),
          formData: () => Promise.resolve(new FormData()),
        } as Response);
      };
      xhr.onerror = () => reject(new Error("XMLHttpRequest network error"));
      xhr.ontimeout = () => reject(new Error("XMLHttpRequest timeout"));
      xhr.timeout = 10000; // 10 second timeout

      if (data && method !== "GET") {
        xhr.send(JSON.stringify(data));
      } else {
        xhr.send();
      }
    });
  } catch (xhrError) {
    // Fallback to fetch
    const options: RequestInit = {
      method,
      headers: {
        "Content-Type": "application/json",
      },
    };

    if (data && method !== "GET") {
      options.body = JSON.stringify(data);
    }

    try {
      response = await fetch(url, options);
    } catch (fetchError) {
      console.error("apiRequest: Both XMLHttpRequest and fetch failed:", {
        method,
        url,
        xhrError,
        fetchError,
      });
      throw new Error(`Failed to ${method} ${url}: All request methods failed`);
    }
  }

  if (!response.ok) {
    throw new Error(`${response.status}: ${response.statusText}`);
  }

  return response.json();
};

// Set up React Query's default fetcher
queryClient.setDefaultOptions({
  queries: {
    queryFn: ({ queryKey }) => defaultFetcher(queryKey[0] as string),
  },
});
