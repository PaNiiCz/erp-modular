import type { ReactNode } from 'react';
import { X } from 'lucide-react';
import { inputClasse } from './utilidades';

interface Props {
  titulo: string;
  onClose: () => void;
  onSubmit: () => void;
  salvando: boolean;
  erro: string;
  largura?: string;
  children: ReactNode;
}

export default function ModalBase({ titulo, onClose, onSubmit, salvando, erro, largura = 'max-w-lg', children }: Props) {
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
        className={`glass-card rounded-2xl p-6 w-full ${largura} max-h-[90vh] overflow-y-auto`}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-text-primary text-lg font-bold font-sans">{titulo}</h2>
          <button type="button" onClick={onClose} className="text-text-secondary hover:text-text-primary">
            <X size={20} />
          </button>
        </div>

        {erro && <p className="text-danger text-sm font-sans mb-3 whitespace-pre-line">{erro}</p>}

        {children}

        <div className="flex justify-end gap-3 mt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-text-secondary font-sans text-sm hover:bg-white/5 transition"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={salvando}
            className="px-5 py-2 rounded-xl bg-primary text-white font-sans text-sm font-semibold hover:opacity-90 transition disabled:opacity-50"
          >
            {salvando ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </form>
    </div>
  );
}

// Campo de dinheiro: o usuário digita só números e o valor vira 0,00 automaticamente.
// O valor guardado no estado fica no formato da API (ex: "2500.00").
export function CampoMoeda({ valor, onChange }: { valor: string; onChange: (novo: string) => void }) {
  const exibido = valor
    ? Number(valor).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : '';

  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary text-sm">R$</span>
      <input
        className={`${inputClasse} pl-9`}
        value={exibido}
        inputMode="numeric"
        placeholder="0,00"
        onChange={(e) => {
          const digitos = e.target.value.replace(/\D/g, '');
          onChange(digitos ? (Number(digitos) / 100).toFixed(2) : '');
        }}
      />
    </div>
  );
}