const BASE = "http://127.0.0.1:8000/api";
const CHAVES_TOKEN = ["access", "access_token", "token", "accessToken"];

function pegarToken(): string {
  for (const chave of CHAVES_TOKEN) {
    const valor = localStorage.getItem(chave);
    if (valor) return valor.replace(/^"|"$/g, "");
  }
  return "";
}

export function lista<T>(dados: unknown): T[] {
  if (Array.isArray(dados)) return dados as T[];
  const r = (dados as { results?: T[] } | null)?.results;
  return Array.isArray(r) ? r : [];
}

export function mensagemErro(e: unknown): string {
  return e instanceof Error ? e.message : "Erro inesperado.";
}

function textoDoErro(dados: unknown, status: number): string {
  if (status === 401) return "Sessão expirada. Faça login de novo.";
  if (dados && typeof dados === "object") {
    const d = dados as Record<string, unknown>;
    if (typeof d.detail === "string") return d.detail;
    const partes = Object.entries(d).map(
      ([k, v]) => `${k}: ${Array.isArray(v) ? v.join(" ") : String(v)}`
    );
    if (partes.length) return partes.join(" | ");
  }
  if (status === 403) return "Você não tem permissão para esta ação.";
  return `Erro ${status}.`;
}

export async function http<T = unknown>(
  metodo: string,
  caminho: string,
  corpo?: unknown
): Promise<T> {
  const token = pegarToken();
  const resposta = await fetch(BASE + caminho, {
    method: metodo,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: corpo === undefined ? undefined : JSON.stringify(corpo),
  });
  if (resposta.status === 204) return null as T;
  const dados = await resposta.json().catch(() => null);
  if (!resposta.ok) throw new Error(textoDoErro(dados, resposta.status));
  return dados as T;
}