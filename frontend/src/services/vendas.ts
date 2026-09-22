import api from './api';
import type { Venda, VendaForm, StatusVenda } from '../types/venda';

interface Paginado<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

interface FiltrosVenda {
  status?: string;
  forma_pagamento?: string;
  cliente?: number;
  busca?: string;
}

export const listarVendas = (filtros: FiltrosVenda = {}) =>
  api
    .get<Paginado<Venda>>('/vendas/', {
      params: {
        status: filtros.status,
        forma_pagamento: filtros.forma_pagamento,
        cliente: filtros.cliente,
        search: filtros.busca,
      },
    })
    .then((res) => res.data);

export const criarVenda = (dados: VendaForm) =>
  api.post<Venda>('/vendas/', dados).then((res) => res.data);

export const atualizarVenda = (id: number, dados: VendaForm) =>
  api.patch<Venda>(`/vendas/${id}/`, dados).then((res) => res.data);

export const excluirVenda = (id: number) =>
  api.delete(`/vendas/${id}/`);

export const alterarStatusVenda = (id: number, status: StatusVenda) =>
  api.patch<Venda>(`/vendas/${id}/`, { status }).then((res) => res.data);