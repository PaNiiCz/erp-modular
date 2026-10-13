import { http, lista } from "./http";

export type Status = "A_FAZER" | "EM_ANDAMENTO" | "EM_REVISAO" | "CONCLUIDA";
export interface Opcao { id: number; nome: string }
export interface Eu { id: number; nome: string; is_staff: boolean }
export interface Tarefa {
  id: number;
  titulo: string;
  descricao?: string;
  tipo: "TAREFA" | "SOLICITACAO";
  status: Status;
  prioridade: string;
  projeto: number | null;
  responsavel: number | null;
  setor_destino: number | null;
  prazo?: string | null;
  ordem?: number;
}
export interface Item { id: number; tarefa: number; texto: string; concluido: boolean }
export interface Comentario {
  id: number;
  tarefa: number;
  texto: string;
  autor?: number;
  usuario?: number;
  autor_nome?: string;
  criado_em?: string;
}

export const obterEu = () => http<Eu>("GET", "/apoio/eu/");
export const listarSetores = async () => lista<Opcao>(await http("GET", "/apoio/setores/"));
export const listarUsuarios = async () => lista<Opcao>(await http("GET", "/apoio/usuarios/"));

export async function listarProjetos(): Promise<Opcao[]> {
  const itens = lista<Record<string, unknown>>(await http("GET", "/projetos/"));
  return itens.map((p) => ({
    id: p.id as number,
    nome: String(p.nome ?? p.titulo ?? `Projeto ${p.id}`),
  }));
}

export const listarTarefas = async () => lista<Tarefa>(await http("GET", "/tarefas/"));

export async function salvarTarefa(id: number | null, dados: Record<string, unknown>) {
  const rota = id ? `/tarefas/${id}/` : "/tarefas/";
  const metodo = id ? "PATCH" : "POST";
  try {
    return await http<Tarefa>(metodo, rota, dados);
  } catch (e) {
    const p = dados.prazo;
    if (e instanceof Error && /prazo/i.test(e.message) && typeof p === "string" && p.length === 10) {
      return http<Tarefa>(metodo, rota, { ...dados, prazo: p + "T23:59:00" });
    }
    throw e;
  }
}

export const excluirTarefa = (id: number) => http("DELETE", `/tarefas/${id}/`);
export const moverTarefa = (id: number, status: Status, ordem: number) =>
  http("POST", `/tarefas/${id}/mover/`, { status, ordem });

export const listarChecklist = async (tarefa: number) =>
  lista<Item>(await http("GET", `/checklist/?tarefa=${tarefa}`));
export const criarItem = (tarefa: number, texto: string) =>
  http("POST", "/checklist/", { tarefa, texto });
export const marcarItem = (id: number, concluido: boolean) =>
  http("PATCH", `/checklist/${id}/`, { concluido });
export const excluirItem = (id: number) => http("DELETE", `/checklist/${id}/`);

export const listarComentarios = async (tarefa: number) =>
  lista<Comentario>(await http("GET", `/comentarios/?tarefa=${tarefa}`));
export const criarComentario = (tarefa: number, texto: string) =>
  http("POST", "/comentarios/", { tarefa, texto });
export const excluirComentario = (id: number) => http("DELETE", `/comentarios/${id}/`);