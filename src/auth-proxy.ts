export function prepareProviderAuthRequest(request: Request, body: unknown): { headers: Headers; body: unknown } {
  const origin = request.headers.get("origin") || new URL(request.url).origin;
  const input = body && typeof body === "object" ? { ...(body as Record<string, unknown>) } : {};
  const callbackURL = input.callbackURL;

  if (typeof callbackURL === "string" && callbackURL.length > 0) {
    input.callbackURL = new URL(callbackURL, origin).toString();
  } else {
    input.callbackURL = new URL("/", origin).toString();
  }

  const upstream = new Headers({ accept: "application/json", origin });
  const cookie = request.headers.get("cookie");
  if (cookie) upstream.set("cookie", cookie);
  const contentType = request.headers.get("content-type");
  if (contentType) upstream.set("content-type", contentType);
  const referer = request.headers.get("referer");
  if (referer) upstream.set("referer", referer);

  return { headers: upstream, body: input };
}
