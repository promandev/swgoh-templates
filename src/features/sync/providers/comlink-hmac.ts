import crypto from "node:crypto";

/**
 * Builds the HMAC-SHA256 request headers required by swgoh-comlink when
 * ACCESS_KEY + SECRET_KEY are set on the server.
 *
 * Signing spec (from comlink wiki):
 *   message  = [timestamp, METHOD, path, md5(body)].join("\n")
 *   signature = HMAC-SHA256(SECRET_KEY, message).hex
 *   headers   = { Authorization: "HMAC-SHA256 Credential=<key>,Signature=<sig>",
 *                 "X-Date": timestamp }
 */
export function buildHmacHeaders(
  method: string,
  path: string,
  body: string,
  accessKey: string,
  secretKey: string,
): Record<string, string> {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const bodyMd5 = crypto.createHash("md5").update(body).digest("hex");
  const message = [timestamp, method.toUpperCase(), path, bodyMd5].join("\n");
  const signature = crypto
    .createHmac("sha256", secretKey)
    .update(message)
    .digest("hex");
  return {
    Authorization: `HMAC-SHA256 Credential=${accessKey},Signature=${signature}`,
    "X-Date": timestamp,
  };
}
