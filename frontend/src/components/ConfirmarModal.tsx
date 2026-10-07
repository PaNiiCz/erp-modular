import '../pages/Agenda.css'

interface Props {
  titulo: string
  mensagem: string
  textoConfirmar?: string
  onConfirmar: () => void
  onCancelar: () => void
}

export default function ConfirmarModal({
  titulo,
  mensagem,
  textoConfirmar = 'Confirmar',
  onConfirmar,
  onCancelar,
}: Props) {
  return (
    <div className="ag-fundo ag-fundo-alto" onClick={onCancelar}>
      <div className="ag-confirma" role="alertdialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <h3>{titulo}</h3>
        <p>{mensagem}</p>
        <div className="ag-acoes">
          <button type="button" className="ag-btn ag-btn-perigo" onClick={onConfirmar}>
            {textoConfirmar}
          </button>
          <button type="button" className="ag-btn" onClick={onCancelar}>
            Voltar
          </button>
        </div>
      </div>
    </div>
  )
}