export async function onRequest(context) {
  const cookie = context.request.headers.get("cookie") ?? "";
  const token = cookie.split(";")
    .find(c => c.trim().startsWith("CF_Authorization="))
    ?.split("=")[1]?.trim();

  const originalUrl = new URL(context.request.url);
  const workerUrl = `https://${context.env.API_URL}${originalUrl.pathname}${originalUrl.search}`;

  const response = await fetch(workerUrl.toString(), {
    method: context.request.method,
    headers: {
      "Content-Type": "application/json",
      "Cf-Access-Jwt-Assertion": token ?? "",
    },
    body: context.request.method !== "GET" ? context.request.body : undefined,
  });

  return response;
}