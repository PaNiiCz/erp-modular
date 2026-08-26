import api from './api';
import type { ResumoDashboard, ProdutoMaisVendido, VendaPorDia, AtividadeRecente } from '../types/dashboard';

export const getResumo = () =>
  api.get<ResumoDashboard>('/dashboard/resumo/').then((res) => res.data);

export const getProdutosMaisVendidos = (limite = 5) =>
  api.get<ProdutoMaisVendido[]>(`/dashboard/produtos-mais-vendidos/?limite=${limite}`).then((res) => res.data);

export const getGraficoVendas = (dias = 30) =>
  api.get<VendaPorDia[]>(`/dashboard/grafico-vendas/?dias=${dias}`).then((res) => res.data);

export const getAtividadesRecentes = (limite = 10) =>
  api.get<AtividadeRecente[]>(`/dashboard/atividades-recentes/?limite=${limite}`).then((res) => res.data);