export interface Categoria {
  id: number;
  nome: string;
}

export interface Marca {
  id: number;
  nome: string;
}

export interface Fornecedor {
  id: number;
  nome: string;
  cnpj: string;
  telefone: string;
  email: string;
}

export interface Produto {
  id: number;
  sku: string;
  codigo_barras: string | null;
  nome: string;
  descricao: string | null;
  categoria: number | null;
  categoria_nome?: string;
  marca: number | null;
  marca_nome?: string;
  fornecedor: number | null;
  fornecedor_nome?: string;
  imagem: string | null;
  preco_custo: string;
  preco_venda: string;
  unidade: 'UN' | 'KG' | 'L' | 'CX' | 'PC';
  estoque_minimo: number;
  status: 'ATIVO' | 'INATIVO' | 'DESCONTINUADO';
  criado_em: string;
  atualizado_em: string;
}

export type ProdutoForm = Omit<Produto, 'id' | 'criado_em' | 'atualizado_em' | 'categoria_nome' | 'marca_nome' | 'fornecedor_nome' | 'imagem'> & {
  imagem?: string | File | null;
};