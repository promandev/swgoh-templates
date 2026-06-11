import crypto from "node:crypto";

/**
 * Builds the HMAC-SHA256 request headers required by swgoh-comlink when
 * ACCESS_KEY + SECRET_KEY are set on the server.
 *
 * Signing spec (matches the reference comlink clients):
 *   reqTime   = current time in **milliseconds** (Date.now())
 *   signature = HMAC-SHA256(SECRET_KEY, reqTime + METHOD + path + md5hex(body))
 *               where the four parts are concatenated with **no separator**
 *               (the reference does successive hmac.update() calls).
 *   headers   = { Authorization: "HMAC-SHA256 Credential=<key>,Signature=<sig>",
 *                 "X-Date": reqTime }
 *
 * The server rejects (403) if reqTime drifts past HMAC_MAX/MIN_DRIFT (±30s by
 * default), so the millisecond timestamp matters — seconds would be ~1000x off.
 */
export function buildHmacHeaders(
  method: string,
  path: string,
  body: string,
  accessKey: string,
  secretKey: string,
): Record<string, string> {
  const reqTime = Date.now().toString();
  const bodyMd5 = crypto.createHash("md5").update(body).digest("hex");
  const signature = crypto
    .createHmac("sha256", secretKey)
    .update(reqTime)
    .update(method.toUpperCase())
    .update(path)
    .update(bodyMd5)
    .digest("hex");
  return {
    Authorization: `HMAC-SHA256 Credential=${accessKey},Signature=${signature}`,
    "X-Date": reqTime,
  };
}
