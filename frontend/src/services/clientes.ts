import api from './api';
import type { Cliente, ClienteForm } from '../types/cliente';

interface ClientesPaginados {
  count: number;
  next: string | null;
  previous: string | null;
  results: Cliente[];
}

export const listarClientes = (busca = '', page = 1) =>
  api.get<ClientesPaginados>('/clientes/', { params: { search: busca, page } }).then((res) => res.data);

export const buscarCliente = (id: number) =>
  api.get<Cliente>(`/clientes/${id}/`).then((res) => res.data);

export const criarCliente = (dados: ClienteForm) =>
  api.post<Cliente>('/clientes/', dados).then((res) => res.data);

export const atualizarCliente = (id: number, dados: ClienteForm) =>
  api.patch<Cliente>(`/clientes/${id}/`, dados).then((res) => res.data);

export const excluirCliente = (id: number) =>
  api.delete(`/clientes/${id}/`);