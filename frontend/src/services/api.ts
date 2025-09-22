export type ApiClientOptions = {
  baseUrl?: string;
  getToken?: () => string | null;
};

export class ApiClient {
  private readonly baseUrl: string;
  private readonly getToken?: () => string | null;

  constructor(options?: ApiClientOptions) {
    this.baseUrl = options?.baseUrl ?? "/";
    this.getToken = options?.getToken;
  }

  private buildHeaders(): HeadersInit {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    const token = this.getToken?.();
    if (token) headers["Authorization"] = `Bearer ${token}`;
    return headers;
  }

  async listDocuments(): Promise<any> {
    const res = await fetch(new URL("v1/documents", this.baseUrl).toString(), {
      method: "GET",
      headers: this.buildHeaders(),
    });
    return res.json();
  }

  async search(q: string, k = 10): Promise<any> {
    const url = new URL("v1/search", this.baseUrl);
    url.searchParams.set("q", q);
    url.searchParams.set("k", String(k));
    const res = await fetch(url.toString(), { headers: this.buildHeaders() });
    return res.json();
  }

  async qa(question: string): Promise<any> {
    const res = await fetch(new URL("v1/qa", this.baseUrl).toString(), {
      method: "POST",
      headers: this.buildHeaders(),
      body: JSON.stringify({ question }),
    });
    return res.json();
  }
}

export const api = new ApiClient();


