import { createServerFn } from "@tanstack/react-start";
import { getWebRequest } from "@tanstack/react-start/server";
import z from "zod";

const ApiCallOptionsSchema = z.object({
  path: z.string(),
  method: z.enum(["GET", "POST", "PUT", "DELETE", "PATCH"]),
  body: z.unknown().optional(),
});

// Infer the TypeScript type from the Zod schema
type ApiCallOptions = z.infer<typeof ApiCallOptionsSchema>;

export const callApi = createServerFn({
  method: "POST",
})
  .validator((options: unknown) => {
    return ApiCallOptionsSchema.parse(options);
  })
  .handler(async (ctx) => {
    const options = ctx.data;
    console.log(`[Server] Calling API: ${options.method} ${options.path}`);

    const request = getWebRequest();
    if (!request) {
      throw new Error("Could not access the server request context.");
    }

    const apiUrl = process.env.GATEWAY_URL || "http://localhost:3001";
    const cookie = request.headers.get("Cookie");

    const headers = new Headers();
    headers.set("Content-Type", "application/json");
    if (cookie) {
      headers.set("Cookie", cookie);
    }

    const response = await fetch(`${apiUrl}/api${options.path}`, {
      method: options.method,
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Server] API Error: ${response.status} ${errorText}`);
      throw new Error(`API request failed: ${response.statusText}`);
    }

    if (response.status === 204) {
      return null;
    }

    return response.json();
  });