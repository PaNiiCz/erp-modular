import { useState } from 'react';
import { mensagemErro } from '../../services/rh';
import type { StatusFerias, StatusFuncionario, TipoDocumento } from '../../types/rh';

export type Cor = 'verde' | 'vermelho' | 'azul' | 'amarelo' | 'cinza';

export const inputClasse =
  'w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-text-primary text-sm font-sans outline-none focus:border-primary';
export const labelClasse = 'text-text-secondary text-xs font-sans block mb-1';

export const statusFuncionario: Record<StatusFuncionario, { label: string; cor: Cor }> = {
  ATIVO: { label: 'Ativo', cor: 'verde' },
  FERIAS: { label: 'Em férias', cor: 'azul' },
  AFASTADO: { label: 'Afastado', cor: 'amarelo' },
  DESLIGADO: { label: 'Desligado', cor: 'cinza' },
};

export const statusFerias: Record<StatusFerias, { label: string; cor: Cor }> = {
  SOLICITADA: { label: 'Solicitada', cor: 'amarelo' },
  APROVADA: { label: 'Aprovada', cor: 'verde' },
  REJEITADA: { label: 'Rejeitada', cor: 'vermelho' },
  CANCELADA: { label: 'Cancelada', cor: 'cinza' },
};

export const tiposDocumento: Record<TipoDocumento, string> = {
  RG: 'RG',
  CPF: 'CPF',
  CTPS: 'Carteira de trabalho',
  CONTRATO: 'Contrato',
  ASO: 'Atestado de saúde ocupacional (ASO)',
  COMPROVANTE: 'Comprovante de residência',
  OUTRO: 'Outro',
};

// A posição na lista é o número do dia usado pela API (0 = segunda)
export const diasSemana = [
  'Segunda-feira',
  'Terça-feira',
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira',
  'Sábado',
  'Domingo',
];

export const formatarMoeda = (valor: string | number) =>
  Number(valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export const formatarData = (valor: string | null) => {
  if (!valor) return '—';
  const [ano, mes, dia] = valor.slice(0, 10).split('-');
  return `${dia}/${mes}/${ano}`;
};

export const formatarHora = (valor: string) => valor.slice(0, 5);

export function mascararCpf(valor: string) {
  return valor
    .replace(/\D/g, '')
    .slice(0, 11)
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
}

export function mascararTelefone(valor: string) {
  const digitos = valor.replace(/\D/g, '').slice(0, 11);
  if (digitos.length <= 10) {
    return digitos.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{4})(\d{1,4})$/, '$1-$2');
  }
  return digitos.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d{1,4})$/, '$1-$2');
}

// Controla "salvando" e "erro" dos formulários e chama onSalvo quando dá certo
export function useEnvio(onSalvo: () => void) {
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');

  const enviar = async (acao: () => Promise<unknown>) => {
    setErro('');
    setSalvando(true);
    try {
      await acao();
      onSalvo();
    } catch (e) {
      setErro(mensagemErro(e));
    } finally {
      setSalvando(false);
    }
  };

  return { salvando, erro, setErro, enviar };
}