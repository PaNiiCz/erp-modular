import { useMemo, useState } from 'react'
import type { KeyboardEvent } from 'react'
import type { UsuarioSimples } from '../services/agendaApi'
import '../pages/Agenda.css'

// Tira acentos e deixa minúsculo, para "joao" achar "João"
const normalizar = (texto: string) =>
  texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()

interface Props {
  usuarios: UsuarioSimples[]
  selecionados: number[]
  onChange: (ids: number[]) => void
}

export default function SeletorConvidados({ usuarios, selecionados, onChange }: Props) {
  const [busca, setBusca] = useState('')

  // "Toda a empresa" fica marcado quando todos os funcionários estão convidados
  const todos = usuarios.length > 0 && usuarios.every((u) => selecionados.includes(u.id))

  const filtrados = useMemo(() => {
    const termo = normalizar(busca.trim())
    if (!termo) return usuarios
    return usuarios.filter((u) => normalizar(`${u.nome} ${u.area}`).includes(termo))
  }, [usuarios, busca])

  const escolhidos = usuarios.filter((u) => selecionados.includes(u.id))

  function alternarTodos(marcado: boolean) {
    onChange(marcado ? usuarios.map((u) => u.id) : [])
    setBusca('')
  }

  function alternarPessoa(id: number) {
    onChange(selecionados.includes(id) ? selecionados.filter((s) => s !== id) : [...selecionados, id])
  }

  // Enter dentro da busca não pode salvar o formulário
  function aoTeclar(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') e.preventDefault()
  }

  return (
    <div className="ag-convidados">
      <span className="ag-titulo-campo">Convidados</span>

      <label className="ag-geral">
        <input type="checkbox" checked={todos} onChange={(e) => alternarTodos(e.target.checked)} />
        <span>
          <strong>Evento para toda a empresa</strong>
          <small>Reunião geral: convida todos os funcionários</small>
        </span>
      </label>

      {todos ? (
        <p className="ag-aviso">Todos os {usuarios.length} funcionários serão convidados.</p>
      ) : (
        <>
          {escolhidos.length > 0 && (
            <div className="ag-escolhidos">
              {escolhidos.map((u) => (
                <button
                  type="button"
                  key={u.id}
                  className="ag-tag"
                  title="Remover convidado"
                  onClick={() => alternarPessoa(u.id)}
                >
                  {u.nome} ×
                </button>
              ))}
            </div>
          )}

          <input
            type="text"
            placeholder="Buscar funcionário por nome ou área..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            onKeyDown={aoTeclar}
          />

          <div className="ag-lista-pessoas">
            {filtrados.length === 0 && <p className="ag-vazio">Ninguém encontrado.</p>}
            {filtrados.map((u) => (
              <label key={u.id} className="ag-pessoa">
                <input
                  type="checkbox"
                  checked={selecionados.includes(u.id)}
                  onChange={() => alternarPessoa(u.id)}
                />
                <span>
                  {u.nome}
                  {u.area && <small>{u.area}</small>}
                </span>
              </label>
            ))}
          </div>
        </>
      )}
    </div>
  )
}