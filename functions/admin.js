export async function onRequest(context) {
  try {
    const url = new URL(context.request.url);
    url.pathname = "/";
    url.searchParams.set("loggedIn", "true");
    return Response.redirect(url.toString(), 302);
  } catch (err) {
    return new Response(err.message, { status: 500 });
  }
}