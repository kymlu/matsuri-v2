export async function onRequest(context) {
  const cookie = context.request.headers.get("cookie") ?? "";
  const token = cookie.split(";")
    .find(c => c.trim().startsWith("CF_Authorization="))
    ?.split("=")[1]?.trim();

  const url = new URL(context.request.url);
  url.hostname = "matsuri-worker.katherine-ym-lu.workers.dev";

  const response = await fetch(url.toString(), {
    method: context.request.method,
    headers: {
      "Content-Type": "application/json",
      "Cf-Access-Jwt-Assertion": token ?? "",
    },
    body: context.request.method !== "GET" ? context.request.body : undefined,
  });

  return response;
}