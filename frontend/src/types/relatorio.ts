export type FormatoRelatorio = 'csv' | 'xlsx' | 'pdf';

export interface FiltrosRelatorioVendas {
  data_inicio?: string;
  data_fim?: string;
  status?: string;
  [key: string]: string | undefined;
}

export interface FiltrosRelatorioFinanceiro {
  data_inicio?: string;
  data_fim?: string;
  tipo?: string;
  status?: string;
  [key: string]: string | undefined;
}

export interface FiltrosRelatorioProdutos {
  data_inicio?: string;
  data_fim?: string;
  [key: string]: string | undefined;
}