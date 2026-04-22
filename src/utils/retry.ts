export async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  retries = 3,
  /** Genderize / network can exceed 5s on slow DNS or rate limits; aborts with AbortError if too low. */
  timeoutMs = 15_000
): Promise<Response> {
  let lastError: unknown;

  for (let i = 0; i < retries; i++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });

      if (response.ok) return response;
      lastError = new Error(`HTTP ${response.status}`);
    } catch (err) {
      lastError = err;
      if (i === retries - 1) throw err;
    } finally {
      clearTimeout(timeout);
    }
  }

  throw lastError instanceof Error ? lastError : new Error('Failed after retries');
}