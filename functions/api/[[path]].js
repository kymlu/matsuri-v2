export async function onRequest(context) {
  const cookie = context.request.headers.get("cookie") ?? "";
  const token = cookie.split(";")
    .find(c => c.trim().startsWith("CF_Authorization="))
    ?.split("=")[1]?.trim();

  console.log("token:", token);
  console.log("cookie:", cookie);

  const url = new URL(context.request.url);
  const apiUrl = context.env.API_URL;
  url.hostname = apiUrl;

  console.log(url);

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