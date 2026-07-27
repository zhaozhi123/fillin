const LOCAL_HTTP_HOSTS = new Set(["localhost", "127.0.0.1"]);

export function normalizeAIBaseUrl(value: string): string {
  const trimmed = value.trim().replace(/\/+$/, "");
  let url: URL;

  try {
    url = new URL(trimmed);
  } catch {
    throw new Error("API 地址格式不正确");
  }

  const isSecureRemote = url.protocol === "https:";
  const isLocalDevelopment =
    url.protocol === "http:" && LOCAL_HTTP_HOSTS.has(url.hostname);

  if (!isSecureRemote && !isLocalDevelopment) {
    throw new Error(
      "远程 API 必须使用 HTTPS；仅 localhost 或 127.0.0.1 可使用 HTTP"
    );
  }

  return trimmed;
}
