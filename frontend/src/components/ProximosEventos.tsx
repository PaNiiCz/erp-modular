import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { agendaApi } from '../services/agendaApi'
import type { Evento } from '../services/agendaApi'
import '../pages/Agenda.css'

const formatar = (iso: string) =>
  new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })

export default function ProximosEventos() {
  const [eventos, setEventos] = useState<Evento[]>([])
  const [falhou, setFalhou] = useState(false)

  useEffect(() => {
    agendaApi.proximos().then(setEventos).catch(() => setFalhou(true))
  }, [])

  return (
    <div className="ag-card">
      <h3>Próximos eventos</h3>
      {falhou && <p>Não foi possível carregar a agenda.</p>}
      {!falhou && eventos.length === 0 && <p>Nenhum evento agendado.</p>}
      <ul>
        {eventos.map((e) => (
          <li key={e.id}>
            <span className="ag-ponto" style={{ background: e.cor }} />
            <div>
              {e.titulo}
              <small>{formatar(e.inicio)}{e.local ? ` · ${e.local}` : ''}</small>
            </div>
          </li>
        ))}
      </ul>
      <p><Link to="/agenda">Abrir agenda completa</Link></p>
    </div>
  )
}