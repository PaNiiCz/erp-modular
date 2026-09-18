import api from './api';
import type { Estoque, MovimentacaoEstoque, MovimentacaoForm } from '../types/estoque';

interface Paginado<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export const listarEstoque = (busca = '') =>
  api.get<Paginado<Estoque> | Estoque[]>('/estoque/', { params: { search: busca } }).then((res) =>
    Array.isArray(res.data) ? res.data : res.data.results
  );

export const listarAlertas = () =>
  api.get<Estoque[]>('/estoque/alertas/').then((res) => res.data);

interface FiltrosMovimentacao {
  produto?: number;
  tipo?: string;
  busca?: string;
}

export const listarMovimentacoes = (filtros: FiltrosMovimentacao = {}) =>
  api
    .get<Paginado<MovimentacaoEstoque>>('/movimentacoes/', {
      params: {
        produto: filtros.produto,
        tipo: filtros.tipo,
        search: filtros.busca,
      },
    })
    .then((res) => res.data);

export const criarMovimentacao = (dados: MovimentacaoForm) =>
  api.post<MovimentacaoEstoque>('/movimentacoes/', dados).then((res) => res.data);