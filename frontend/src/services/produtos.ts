import api from './api';
import type { Produto, ProdutoForm, Categoria, Marca, Fornecedor } from '../types/produto';

interface Paginado<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

function montarFormData(dados: ProdutoForm): FormData {
  const formData = new FormData();
  Object.entries(dados).forEach(([chave, valor]) => {
    if (chave === 'imagem') {
      if (valor instanceof File) {
        formData.append('imagem', valor);
      }
      return;
    }
    if (valor === null || valor === undefined) return;
    formData.append(chave, String(valor));
  });
  return formData;
}

export const listarProdutos = (busca = '', page = 1) =>
  api.get<Paginado<Produto>>('/produtos/', { params: { search: busca, page } }).then((res) => res.data);

export const criarProduto = (dados: ProdutoForm) =>
  api.post<Produto>('/produtos/', montarFormData(dados)).then((res) => res.data);

export const atualizarProduto = (id: number, dados: ProdutoForm) =>
  api.patch<Produto>(`/produtos/${id}/`, montarFormData(dados)).then((res) => res.data);

export const excluirProduto = (id: number) =>
  api.delete(`/produtos/${id}/`);

export const listarCategorias = () =>
  api.get<Paginado<Categoria> | Categoria[]>('/categorias/').then((res) =>
    Array.isArray(res.data) ? res.data : res.data.results
  );

export const listarMarcas = () =>
  api.get<Paginado<Marca> | Marca[]>('/marcas/').then((res) =>
    Array.isArray(res.data) ? res.data : res.data.results
  );

export const listarFornecedores = () =>
  api.get<Paginado<Fornecedor> | Fornecedor[]>('/fornecedores/').then((res) =>
    Array.isArray(res.data) ? res.data : res.data.results
  );