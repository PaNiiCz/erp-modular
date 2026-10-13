import { http, lista } from "./http";

export type Categoria = "ENTRADA" | "SAIDA" | "ENTREGA" | "GERAL";
export interface Comunicado {
  id: number;
  titulo: string;
  texto: string;
  categoria: Categoria;
  fixado: boolean;
  autor_nome: string;
  lido: boolean;
  total_leituras: number;
  criado_em: string;
}
export interface Leitura { usuario: number; usuario_nome: string; lida_em: string }

export const listarComunicados = async () =>
  lista<Comunicado>(await http("GET", "/comunicados/"));
export const salvarComunicado = (id: number | null, dados: Record<string, unknown>) =>
  id
    ? http<Comunicado>("PATCH", `/comunicados/${id}/`, dados)
    : http<Comunicado>("POST", "/comunicados/", dados);
export const excluirComunicado = (id: number) => http("DELETE", `/comunicados/${id}/`);
export const marcarLido = (id: number) => http("POST", `/comunicados/${id}/marcar-lido/`);
export const listarLeituras = async (id: number) =>
  lista<Leitura>(await http("GET", `/comunicados/${id}/leituras/`));