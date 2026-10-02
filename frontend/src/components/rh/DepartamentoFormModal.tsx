import { useState } from 'react';
import ModalBase from './ModalBase';
import { inputClasse, labelClasse, useEnvio } from './utilidades';
import { departamentosApi } from '../../services/rh';
import type { Departamento } from '../../types/rh';

interface Props {
  item: Departamento | null;
  onClose: () => void;
  onSalvo: () => void;
}

export default function DepartamentoFormModal({ item, onClose, onSalvo }: Props) {
  const [nome, setNome] = useState(item?.nome ?? '');
  const [descricao, setDescricao] = useState(item?.descricao ?? '');
  const [ativo, setAtivo] = useState(item?.ativo ?? true);
  const { salvando, erro, setErro, enviar } = useEnvio(onSalvo);

  const salvar = () => {
    if (!nome.trim()) {
      setErro('Informe o nome do departamento.');
      return;
    }
    const dados = { nome: nome.trim(), descricao, ativo };
    enviar(() => (item ? departamentosApi.atualizar(item.id, dados) : departamentosApi.criar(dados)));
  };

  return (
    <ModalBase
      titulo={item ? 'Editar departamento' : 'Novo departamento'}
      onClose={onClose}
      onSubmit={salvar}
      salvando={salvando}
      erro={erro}
    >
      <div className="mb-3">
        <label className={labelClasse}>Nome</label>
        <input className={inputClasse} value={nome} onChange={(e) => setNome(e.target.value)} />
      </div>
      <div className="mb-3">
        <label className={labelClasse}>Descrição</label>
        <textarea className={inputClasse} rows={3} value={descricao} onChange={(e) => setDescricao(e.target.value)} />
      </div>
      <label className="flex items-center gap-2 text-text-secondary text-sm font-sans">
        <input type="checkbox" checked={ativo} onChange={(e) => setAtivo(e.target.checked)} />
        Departamento ativo
      </label>
    </ModalBase>
  );
}