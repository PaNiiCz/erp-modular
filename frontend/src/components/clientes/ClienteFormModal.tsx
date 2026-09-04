import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import type { Cliente, ClienteForm } from '../../types/cliente';

interface Props {
  cliente: Cliente | null;
  onClose: () => void;
  onSalvar: (dados: ClienteForm) => Promise<void>;
}

const vazio: ClienteForm = {
  tipo_pessoa: 'PF',
  nome: '',
  nome_fantasia: '',
  cpf_cnpj: '',
  email: '',
  telefone_principal: '',
  telefone_secundario: '',
  cep: '',
  logradouro: '',
  numero: '',
  complemento: '',
  bairro: '',
  cidade: '',
  estado: '',
  etiquetas: '',
  observacoes: '',
  ativo: true,
};

const ESTADOS = [
  { sigla: 'AC', nome: 'Acre' }, { sigla: 'AL', nome: 'Alagoas' }, { sigla: 'AP', nome: 'Amapá' },
  { sigla: 'AM', nome: 'Amazonas' }, { sigla: 'BA', nome: 'Bahia' }, { sigla: 'CE', nome: 'Ceará' },
  { sigla: 'DF', nome: 'Distrito Federal' }, { sigla: 'ES', nome: 'Espírito Santo' }, { sigla: 'GO', nome: 'Goiás' },
  { sigla: 'MA', nome: 'Maranhão' }, { sigla: 'MT', nome: 'Mato Grosso' }, { sigla: 'MS', nome: 'Mato Grosso do Sul' },
  { sigla: 'MG', nome: 'Minas Gerais' }, { sigla: 'PA', nome: 'Pará' }, { sigla: 'PB', nome: 'Paraíba' },
  { sigla: 'PR', nome: 'Paraná' }, { sigla: 'PE', nome: 'Pernambuco' }, { sigla: 'PI', nome: 'Piauí' },
  { sigla: 'RJ', nome: 'Rio de Janeiro' }, { sigla: 'RN', nome: 'Rio Grande do Norte' }, { sigla: 'RS', nome: 'Rio Grande do Sul' },
  { sigla: 'RO', nome: 'Rondônia' }, { sigla: 'RR', nome: 'Roraima' }, { sigla: 'SC', nome: 'Santa Catarina' },
  { sigla: 'SP', nome: 'São Paulo' }, { sigla: 'SE', nome: 'Sergipe' }, { sigla: 'TO', nome: 'Tocantins' },
];

function maskCpfCnpj(value: string, tipo: 'PF' | 'PJ') {
  const digits = value.replace(/\D/g, '').slice(0, tipo === 'PF' ? 11 : 14);
  if (tipo === 'PF') {
    return digits
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  }
  return digits
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1/$2')
    .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
}

function maskTelefone(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 10) {
    return digits.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{4})(\d{1,4})$/, '$1-$2');
  }
  return digits.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d{1,4})$/, '$1-$2');
}

function maskCep(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 8);
  return digits.replace(/(\d{5})(\d{1,3})$/, '$1-$2');
}

export default function ClienteFormModal({ cliente, onClose, onSalvar }: Props) {
  const [form, setForm] = useState<ClienteForm>(vazio);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  const [cidades, setCidades] = useState<string[]>([]);
  const [buscandoCep, setBuscandoCep] = useState(false);

  useEffect(() => {
    if (cliente) {
      const { id, criado_em, atualizado_em, ...resto } = cliente;
      setForm(resto);
    } else {
      setForm(vazio);
    }
  }, [cliente]);

  useEffect(() => {
    if (!form.estado) {
      setCidades([]);
      return;
    }
    fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${form.estado}/municipios`)
      .then((res) => res.json())
      .then((data) => setCidades(data.map((m: { nome: string }) => m.nome)))
      .catch(() => setCidades([]));
  }, [form.estado]);

  const campo = (name: keyof ClienteForm, valor: string) => {
    setForm((f) => ({ ...f, [name]: valor }));
  };

  const buscarCep = async () => {
    const cepLimpo = form.cep.replace(/\D/g, '');
    if (cepLimpo.length !== 8) return;
    setBuscandoCep(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
      const data = await res.json();
      if (!data.erro) {
        setForm((f) => ({
          ...f,
          logradouro: data.logradouro || f.logradouro,
          bairro: data.bairro || f.bairro,
          cidade: data.localidade || f.cidade,
          estado: data.uf || f.estado,
        }));
      }
    } catch {
      // silencioso — se a busca falhar, o usuário preenche manualmente
    } finally {
      setBuscandoCep(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    setSalvando(true);
    try {
      await onSalvar(form);
    } catch {
      setErro('Não foi possível salvar. Verifique os dados (CPF/CNPJ pode já estar cadastrado).');
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
            {cliente ? 'Editar cliente' : 'Novo cliente'}
          </h2>
          <button type="button" onClick={onClose} className="text-text-secondary hover:text-text-primary">
            <X size={20} />
          </button>
        </div>

        {erro && <p className="text-danger text-sm font-sans mb-3">{erro}</p>}

        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className={label}>Tipo de pessoa</label>
            <select
              className={input}
              value={form.tipo_pessoa}
              onChange={(e) => {
                const tipo = e.target.value as 'PF' | 'PJ';
                setForm((f) => ({ ...f, tipo_pessoa: tipo, cpf_cnpj: maskCpfCnpj(f.cpf_cnpj, tipo) }));
              }}
            >
              <option value="PF">Pessoa Física</option>
              <option value="PJ">Pessoa Jurídica</option>
            </select>
          </div>
          <div>
            <label className={label}>CPF/CNPJ</label>
            <input
              className={input}
              value={form.cpf_cnpj}
              onChange={(e) => campo('cpf_cnpj', maskCpfCnpj(e.target.value, form.tipo_pessoa))}
              placeholder={form.tipo_pessoa === 'PF' ? '000.000.000-00' : '00.000.000/0000-00'}
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className={label}>Nome</label>
            <input className={input} value={form.nome} onChange={(e) => campo('nome', e.target.value)} required />
          </div>
          <div>
            <label className={label}>Nome fantasia</label>
            <input className={input} value={form.nome_fantasia ?? ''} onChange={(e) => campo('nome_fantasia', e.target.value)} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className={label}>E-mail</label>
            <input type="email" className={input} value={form.email} onChange={(e) => campo('email', e.target.value)} required />
          </div>
          <div>
            <label className={label}>Telefone principal</label>
            <input
              className={input}
              value={form.telefone_principal}
              onChange={(e) => campo('telefone_principal', maskTelefone(e.target.value))}
              placeholder="(00) 00000-0000"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-3">
          <div>
            <label className={label}>CEP</label>
            <input
              className={input}
              value={form.cep}
              onChange={(e) => campo('cep', maskCep(e.target.value))}
              onBlur={buscarCep}
              placeholder="00000-000"
            />
            {buscandoCep && <p className="text-accent-blue text-xs font-sans mt-1">Buscando endereço...</p>}
          </div>
          <div className="col-span-2">
            <label className={label}>Logradouro</label>
            <input className={input} value={form.logradouro} onChange={(e) => campo('logradouro', e.target.value)} />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-3">
          <div>
            <label className={label}>Número</label>
            <input className={input} value={form.numero} onChange={(e) => campo('numero', e.target.value)} />
          </div>
          <div>
            <label className={label}>Bairro</label>
            <input className={input} value={form.bairro} onChange={(e) => campo('bairro', e.target.value)} />
          </div>
          <div>
            <label className={label}>Estado</label>
            <select className={input} value={form.estado} onChange={(e) => campo('estado', e.target.value)}>
              <option value="">Selecione...</option>
              {ESTADOS.map((uf) => (
                <option key={uf.sigla} value={uf.sigla}>{uf.nome}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label className={label}>Cidade</label>
            <select className={input} value={form.cidade} onChange={(e) => campo('cidade', e.target.value)} disabled={!form.estado}>
              <option value="">{form.estado ? 'Selecione...' : 'Selecione o estado primeiro'}</option>
              {form.cidade && !cidades.includes(form.cidade) && (
                <option value={form.cidade}>{form.cidade}</option>
              )}
              {cidades.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={label}>Etiquetas</label>
            <input className={input} value={form.etiquetas ?? ''} onChange={(e) => campo('etiquetas', e.target.value)} placeholder="vip, atacado" />
          </div>
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