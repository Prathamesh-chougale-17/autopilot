import { RPCHandler } from "@orpc/server/fetch";
import { OpenAPIHandler } from "@orpc/openapi/fetch";
import { onError } from "@orpc/server";
import { router } from "@/lib/router";

const rpcHandler = new RPCHandler(router, {
  interceptors: [
    onError((error) => {
      console.error(error);
    }),
  ],
});

const openAPIHandler = new OpenAPIHandler(router, {
  interceptors: [
    onError((error) => {
      console.error(error);
    }),
  ],
});

async function handleRequest(request: Request) {
  // Try OpenAPI handler first (for REST routes)
  const openAPIResult = await openAPIHandler.handle(request, {
    prefix: "/rpc",
    context: {},
  });

  if (openAPIResult.response) {
    return openAPIResult.response;
  }

  // Fallback to RPC handler (for procedure calls)
  const rpcResult = await rpcHandler.handle(request, {
    prefix: "/rpc",
    context: {},
  });

  return rpcResult.response ?? new Response("Not found", { status: 404 });
}

export const HEAD = handleRequest;
export const GET = handleRequest;
export const POST = handleRequest;
export const PUT = handleRequest;
export const PATCH = handleRequest;
export const DELETE = handleRequest;
