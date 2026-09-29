import api from './api';
import type { Compra, CompraForm, StatusCompra } from '../types/compra';

interface Paginado<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

interface FiltrosCompra {
  status?: string;
  forma_pagamento?: string;
  fornecedor?: number;
  busca?: string;
}

export const listarCompras = (filtros: FiltrosCompra = {}) =>
  api
    .get<Paginado<Compra>>('/compras/', {
      params: {
        status: filtros.status,
        forma_pagamento: filtros.forma_pagamento,
        fornecedor: filtros.fornecedor,
        search: filtros.busca,
      },
    })
    .then((res) => res.data);

export const criarCompra = (dados: CompraForm) =>
  api.post<Compra>('/compras/', dados).then((res) => res.data);

export const atualizarCompra = (id: number, dados: CompraForm) =>
  api.patch<Compra>(`/compras/${id}/`, dados).then((res) => res.data);

export const excluirCompra = (id: number) =>
  api.delete(`/compras/${id}/`);

export const alterarStatusCompra = (id: number, status: StatusCompra) =>
  api.patch<Compra>(`/compras/${id}/`, { status }).then((res) => res.data);