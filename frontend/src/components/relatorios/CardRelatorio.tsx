import { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import type { FormatoRelatorio } from '../../types/relatorio';

interface FiltroExtra {
  label: string;
  tipo: 'select';
  opcoes: { valor: string; label: string }[];
  valor: string;
  onChange: (valor: string) => void;
}

interface Props {
  titulo: string;
  descricao: string;
  dataInicio: string;
  dataFim: string;
  onChangeDataInicio: (valor: string) => void;
  onChangeDataFim: (valor: string) => void;
  filtrosExtras?: FiltroExtra[];
  onBaixar: (formato: FormatoRelatorio) => Promise<void>;
}

export default function CardRelatorio({
  titulo,
  descricao,
  dataInicio,
  dataFim,
  onChangeDataInicio,
  onChangeDataFim,
  filtrosExtras = [],
  onBaixar,
}: Props) {
  const [formato, setFormato] = useState<FormatoRelatorio>('csv');
  const [baixando, setBaixando] = useState(false);
  const [erro, setErro] = useState('');

  const input = 'w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-text-primary text-sm font-sans outline-none focus:border-primary';
  const label = 'text-text-secondary text-xs font-sans block mb-1';

  const handleBaixar = async () => {
    setErro('');
    setBaixando(true);
    try {
      await onBaixar(formato);
    } catch {
      setErro('Não foi possível gerar o relatório.');
    } finally {
      setBaixando(false);
    }
  };

  return (
    <div className="glass-card rounded-2xl p-6">
      <h2 className="text-text-primary text-lg font-bold font-sans">{titulo}</h2>
      <p className="text-text-secondary text-sm font-sans mb-4">{descricao}</p>

      {erro && <p className="text-danger text-sm font-sans mb-3">{erro}</p>}

      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <label className={label}>De</label>
          <input type="date" className={input} value={dataInicio} onChange={(e) => onChangeDataInicio(e.target.value)} />
        </div>
        <div>
          <label className={label}>Até</label>
          <input type="date" className={input} value={dataFim} onChange={(e) => onChangeDataFim(e.target.value)} />
        </div>
      </div>

      {filtrosExtras.length > 0 && (
        <div className="grid grid-cols-2 gap-3 mb-3">
          {filtrosExtras.map((filtro) => (
            <div key={filtro.label}>
              <label className={label}>{filtro.label}</label>
              <select className={input} value={filtro.valor} onChange={(e) => filtro.onChange(e.target.value)}>
                {filtro.opcoes.map((op) => (
                  <option key={op.valor} value={op.valor}>{op.label}</option>
                ))}
              </select>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center gap-3">
        <select
          className={input}
          value={formato}
          onChange={(e) => setFormato(e.target.value as FormatoRelatorio)}
        >
          <option value="csv">CSV</option>
          <option value="xlsx">Excel (.xlsx)</option>
          <option value="pdf">PDF</option>
        </select>
        <button
          onClick={handleBaixar}
          disabled={baixando}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white font-sans text-sm font-semibold hover:opacity-90 transition disabled:opacity-50 whitespace-nowrap"
        >
          {baixando ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
          {baixando ? 'Gerando...' : 'Baixar'}
        </button>
      </div>
    </div>
  );
}