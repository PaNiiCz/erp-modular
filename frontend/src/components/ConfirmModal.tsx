interface Props {
  titulo: string;
  mensagem: string;
  onConfirmar: () => void;
  onCancelar: () => void;
  confirmando?: boolean;
}

export default function ConfirmModal({ titulo, mensagem, onConfirmar, onCancelar, confirmando }: Props) {
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-[60]">
      <div className="glass-card rounded-2xl p-6 w-full max-w-sm">
        <h2 className="text-text-primary text-lg font-bold font-sans mb-2">{titulo}</h2>
        <p className="text-text-secondary text-sm font-sans mb-6">{mensagem}</p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancelar}
            className="px-4 py-2 rounded-xl text-text-secondary font-sans text-sm hover:bg-white/5 transition"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirmar}
            disabled={confirmando}
            className="px-5 py-2 rounded-xl bg-danger text-white font-sans text-sm font-semibold hover:opacity-90 transition disabled:opacity-50"
          >
            {confirmando ? 'Excluindo...' : 'Excluir'}
          </button>
        </div>
      </div>
    </div>
  );
}