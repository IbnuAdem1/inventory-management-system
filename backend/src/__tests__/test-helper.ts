// backend/src/__tests__/test-helper.ts
import http from "http";
import app from "../app";

export interface TestServer {
  server: http.Server;
  baseUrl: string;
  close: () => Promise<void>;
}

export function startTestServer(): Promise<TestServer> {
  return new Promise((resolve) => {
    const server = http.createServer(app);
    server.listen(0, "127.0.0.1", () => {
      const addr = server.address();
      const port = typeof addr === "object" && addr ? addr.port : 3000;
      const baseUrl = `http://127.0.0.1:${port}/api/v1`;

      resolve({
        server,
        baseUrl,
        close: () =>
          new Promise<void>((res) => {
            server.close(() => res());
          }),
      });
    });
  });
}

export async function apiRequest<T = any>(
  baseUrl: string,
  path: string,
  options: {
    method?: string;
    token?: string;
    body?: any;
  } = {}
): Promise<{ status: number; data: T }> {
  const url = `${baseUrl}${path.startsWith("/") ? path : `/${path}`}`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (options.token) {
    headers["Authorization"] = `Bearer ${options.token}`;
  }

  const response = await fetch(url, {
    method: options.method || "GET",
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  let data: any = null;
  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    try {
      data = await response.json();
    } catch {
      data = null;
    }
  } else {
    data = await response.text();
  }

  return {
    status: response.status,
    data,
  };
}
