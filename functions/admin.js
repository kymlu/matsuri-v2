export function onRequest() {
  console.log("Reached the admin page.")
  return new Response("OK");
}