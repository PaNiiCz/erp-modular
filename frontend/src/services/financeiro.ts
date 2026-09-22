import api from './api';
import type { CategoriaFinanceira, LancamentoFinanceiro, LancamentoForm, ResumoFinanceiro } from '../types/financeiro';

interface Paginado<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

interface FiltrosLancamento {
  tipo?: string;
  status?: string;
  forma_pagamento?: string;
  categoria?: number;
  busca?: string;
}

export const listarLancamentos = (filtros: FiltrosLancamento = {}) =>
  api
    .get<Paginado<LancamentoFinanceiro>>('/financeiro/lancamentos/', {
      params: {
        tipo: filtros.tipo,
        status: filtros.status,
        forma_pagamento: filtros.forma_pagamento,
        categoria: filtros.categoria,
        search: filtros.busca,
      },
    })
    .then((res) => res.data);

export const buscarResumo = () =>
  api.get<ResumoFinanceiro>('/financeiro/lancamentos/resumo/').then((res) => res.data);

export const criarLancamento = (dados: LancamentoForm) =>
  api.post<LancamentoFinanceiro>('/financeiro/lancamentos/', dados).then((res) => res.data);

export const atualizarLancamento = (id: number, dados: Partial<LancamentoForm>) =>
  api.patch<LancamentoFinanceiro>(`/financeiro/lancamentos/${id}/`, dados).then((res) => res.data);

export const excluirLancamento = (id: number) =>
  api.delete(`/financeiro/lancamentos/${id}/`);

export const listarCategoriasFinanceiras = (tipo?: string) =>
  api
    .get<Paginado<CategoriaFinanceira> | CategoriaFinanceira[]>('/financeiro/categorias/', {
      params: tipo ? { tipo } : undefined,
    })
    .then((res) => (Array.isArray(res.data) ? res.data : res.data.results));