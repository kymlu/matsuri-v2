export async function onRequest(context) {
  const originalUrl = new URL(context.request.url);
  const workerUrl = `https://${context.env.API_URL}${originalUrl.pathname}${originalUrl.search}`;

  const response = await fetch(workerUrl.toString(), {
    method: context.request.method,
    headers: {
      "Content-Type": "application/json",
      "cookie": context.request.headers.get("cookie") ?? "",
    },
    body: context.request.method !== "GET" ? context.request.body : undefined,
  });

  return response;
}