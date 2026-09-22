import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import type { LancamentoForm, TipoLancamento, StatusLancamento, FormaPagamentoFinanceiro, CategoriaFinanceira, LancamentoFinanceiro } from '../../types/financeiro';
import type { Cliente } from '../../types/cliente';
import { listarCategoriasFinanceiras } from '../../services/financeiro';
import { listarClientes } from '../../services/clientes';

interface Props {
  lancamento: LancamentoFinanceiro | null;
  onClose: () => void;
  onSalvar: (dados: LancamentoForm) => Promise<void>;
}

const hoje = () => new Date().toISOString().slice(0, 10);

const vazio: LancamentoForm = {
  tipo: 'RECEITA',
  categoria: null,
  cliente: null,
  descricao: '',
  valor: '0.00',
  forma_pagamento: 'DINHEIRO',
  status: 'PENDENTE',
  data_vencimento: hoje(),
  data_pagamento: null,
  parcela_atual: 1,
  total_parcelas: 1,
  observacoes: '',
};

function formatarMoeda(digitos: string): string {
  const limpo = digitos.replace(/\D/g, '');
  if (!limpo) return '';
  const numero = Number(limpo) / 100;
  return numero.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function paraFormatoBackend(exibido: string): string {
  const limpo = exibido.replace(/\D/g, '');
  if (!limpo) return '0.00';
  return (Number(limpo) / 100).toFixed(2);
}

function paraExibicao(valorBackend: string): string {
  const numero = Number(valorBackend || '0');
  return numero.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function LancamentoFormModal({ lancamento, onClose, onSalvar }: Props) {
  const [form, setForm] = useState<LancamentoForm>(vazio);
  const [valorExibido, setValorExibido] = useState('');
  const [categorias, setCategorias] = useState<CategoriaFinanceira[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');

  useEffect(() => {
    listarClientes().then((dados) => setClientes(dados.results)).catch(() => setClientes([]));
  }, []);

  useEffect(() => {
    listarCategoriasFinanceiras(form.tipo).then(setCategorias).catch(() => setCategorias([]));
  }, [form.tipo]);

  useEffect(() => {
    if (lancamento) {
      setForm({
        tipo: lancamento.tipo,
        categoria: lancamento.categoria,
        cliente: lancamento.cliente,
        descricao: lancamento.descricao,
        valor: lancamento.valor,
        forma_pagamento: lancamento.forma_pagamento,
        status: lancamento.status,
        data_vencimento: lancamento.data_vencimento,
        data_pagamento: lancamento.data_pagamento,
        parcela_atual: lancamento.parcela_atual,
        total_parcelas: lancamento.total_parcelas,
        observacoes: lancamento.observacoes ?? '',
      });
      setValorExibido(paraExibicao(lancamento.valor));
    } else {
      setForm(vazio);
      setValorExibido('');
    }
  }, [lancamento]);

  const campo = <K extends keyof LancamentoForm>(name: K, valor: LancamentoForm[K]) => {
    setForm((f) => ({ ...f, [name]: valor }));
  };

  const handleValorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digitos = e.target.value.replace(/\D/g, '');
    setValorExibido(formatarMoeda(digitos));
    campo('valor', paraFormatoBackend(digitos));
  };

  const handleStatusChange = (status: StatusLancamento) => {
    campo('status', status);
    if (status === 'PAGO' && !form.data_pagamento) {
      campo('data_pagamento', hoje());
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    if (!form.descricao.trim()) {
      setErro('Informe uma descrição.');
      return;
    }
    if (Number(form.valor) <= 0) {
      setErro('Informe um valor maior que zero.');
      return;
    }
    setSalvando(true);
    try {
      await onSalvar(form);
    } catch {
      setErro('Não foi possível salvar o lançamento.');
    } finally {
      setSalvando(false);
    }
  };

  const input = 'w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-text-primary text-sm font-sans outline-none focus:border-primary';
  const label = 'text-text-secondary text-xs font-sans block mb-1';

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
      <form onSubmit={handleSubmit} className="glass-card rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-text-primary text-lg font-bold font-sans">
            {lancamento ? 'Editar lançamento' : 'Novo lançamento'}
          </h2>
          <button type="button" onClick={onClose} className="text-text-secondary hover:text-text-primary">
            <X size={20} />
          </button>
        </div>

        {erro && <p className="text-danger text-sm font-sans mb-3">{erro}</p>}

        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className={label}>Tipo</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => campo('tipo', 'RECEITA' as TipoLancamento)}
                className={`flex-1 px-3 py-2 rounded-lg text-sm font-sans font-semibold transition ${
                  form.tipo === 'RECEITA' ? 'bg-secondary text-white' : 'bg-white/5 text-text-secondary border border-white/10'
                }`}
              >
                Receita
              </button>
              <button
                type="button"
                onClick={() => campo('tipo', 'DESPESA' as TipoLancamento)}
                className={`flex-1 px-3 py-2 rounded-lg text-sm font-sans font-semibold transition ${
                  form.tipo === 'DESPESA' ? 'bg-danger text-white' : 'bg-white/5 text-text-secondary border border-white/10'
                }`}
              >
                Despesa
              </button>
            </div>
          </div>
          <div>
            <label className={label}>Categoria</label>
            <select
              className={input}
              value={form.categoria ?? ''}
              onChange={(e) => campo('categoria', e.target.value ? Number(e.target.value) : null)}
            >
              <option value="">Nenhuma</option>
              {categorias.map((c) => (
                <option key={c.id} value={c.id}>{c.nome}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="mb-3">
          <label className={label}>Descrição</label>
          <input className={input} value={form.descricao} onChange={(e) => campo('descricao', e.target.value)} required />
        </div>

        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className={label}>Cliente (opcional)</label>
            <select
              className={input}
              value={form.cliente ?? ''}
              onChange={(e) => campo('cliente', e.target.value ? Number(e.target.value) : null)}
            >
              <option value="">Nenhum</option>
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>{c.nome}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={label}>Valor</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary text-sm">R$</span>
              <input
                className={`${input} pl-9`}
                value={valorExibido}
                onChange={handleValorChange}
                inputMode="numeric"
                placeholder="0,00"
                required
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className={label}>Forma de pagamento</label>
            <select
              className={input}
              value={form.forma_pagamento}
              onChange={(e) => campo('forma_pagamento', e.target.value as FormaPagamentoFinanceiro)}
            >
              <option value="DINHEIRO">Dinheiro</option>
              <option value="PIX">Pix</option>
              <option value="CARTAO_CREDITO">Cartão de Crédito</option>
              <option value="CARTAO_DEBITO">Cartão de Débito</option>
              <option value="BOLETO">Boleto</option>
              <option value="TRANSFERENCIA">Transferência</option>
            </select>
          </div>
          <div>
            <label className={label}>Status</label>
            <select
              className={input}
              value={form.status}
              onChange={(e) => handleStatusChange(e.target.value as StatusLancamento)}
            >
              <option value="PENDENTE">Pendente</option>
              <option value="PAGO">Pago</option>
              <option value="ATRASADO">Atrasado</option>
              <option value="CANCELADO">Cancelado</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className={label}>Data de vencimento</label>
            <input
              type="date"
              className={input}
              value={form.data_vencimento}
              onChange={(e) => campo('data_vencimento', e.target.value)}
              required
            />
          </div>
          <div>
            <label className={label}>Data de pagamento</label>
            <input
              type="date"
              className={input}
              value={form.data_pagamento ?? ''}
              onChange={(e) => campo('data_pagamento', e.target.value || null)}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className={label}>Parcela atual</label>
            <input
              type="number"
              min={1}
              className={input}
              value={form.parcela_atual}
              onChange={(e) => campo('parcela_atual', Number(e.target.value))}
            />
          </div>
          <div>
            <label className={label}>Total de parcelas</label>
            <input
              type="number"
              min={1}
              className={input}
              value={form.total_parcelas}
              onChange={(e) => campo('total_parcelas', Number(e.target.value))}
            />
          </div>
        </div>

        <div className="mb-4">
          <label className={label}>Observações</label>
          <textarea className={input} rows={2} value={form.observacoes} onChange={(e) => campo('observacoes', e.target.value)} />
        </div>

        <div className="flex justify-end gap-3">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl text-text-secondary font-sans text-sm hover:bg-white/5 transition">
            Cancelar
          </button>
          <button type="submit" disabled={salvando} className="px-5 py-2 rounded-xl bg-primary text-white font-sans text-sm font-semibold hover:opacity-90 transition disabled:opacity-50">
            {salvando ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </form>
    </div>
  );
}