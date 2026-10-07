export type Prompt = {
  id: number;
  title: string;
  content: string;
  tags: string[];
  favorite: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
};

export type PromptInput = Pick<Prompt, 'title' | 'content' | 'tags' | 'favorite'>;

export type Me = { id: string; name: string; roles: string[] };

export function createApi(accessToken: string) {
  async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const res = await fetch(`/api${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        ...(body ? { 'Content-Type': 'application/json' } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
      const { error } = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(error);
    }
    return res.status === 204 ? (undefined as T) : res.json();
  }

  return {
    me: () => request<Me>('GET', '/me'),
    list: () => request<Prompt[]>('GET', '/prompts'),
    create: (input: PromptInput) => request<Prompt>('POST', '/prompts', input),
    update: (id: number, input: PromptInput) => request<Prompt>('PUT', `/prompts/${id}`, input),
    remove: (id: number) => request<void>('DELETE', `/prompts/${id}`),
  };
}

export type Api = ReturnType<typeof createApi>;
