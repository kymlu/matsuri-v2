export function onRequest() {
  const url = new URL(context.request.url);
  url.pathname = "/";
  url.searchParams.set("loggedIn", "true");
  return Response.redirect(url.toString(), 302);
}