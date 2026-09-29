import api from './api';
import type { FormatoRelatorio, FiltrosRelatorioVendas, FiltrosRelatorioFinanceiro, FiltrosRelatorioProdutos } from '../types/relatorio';

const extensaoPorFormato: Record<FormatoRelatorio, string> = {
  csv: 'csv',
  xlsx: 'xlsx',
  pdf: 'pdf',
};

// Baixa o arquivo do endpoint e dispara o download no navegador
async function baixarRelatorio(url: string, params: Record<string, string | undefined>, formato: FormatoRelatorio, nomeArquivo: string) {
  const resposta = await api.get(url, {
    params: { ...params, formato },
    responseType: 'blob',
  });

  const blob = new Blob([resposta.data]);
  const urlObjeto = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = urlObjeto;
  link.download = `${nomeArquivo}.${extensaoPorFormato[formato]}`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(urlObjeto);
}

export const baixarRelatorioVendas = (filtros: FiltrosRelatorioVendas, formato: FormatoRelatorio) =>
  baixarRelatorio('/relatorios/vendas/', filtros, formato, 'relatorio_vendas');

export const baixarRelatorioFinanceiro = (filtros: FiltrosRelatorioFinanceiro, formato: FormatoRelatorio) =>
  baixarRelatorio('/relatorios/financeiro/', filtros, formato, 'relatorio_financeiro');

export const baixarRelatorioProdutos = (filtros: FiltrosRelatorioProdutos, formato: FormatoRelatorio) =>
  baixarRelatorio('/relatorios/produtos-mais-vendidos/', filtros, formato, 'relatorio_produtos_mais_vendidos');