import { useEffect, useState } from 'react';
import ModalBase from './ModalBase';
import SelectCampo from '../SelectCampo';
import { inputClasse, labelClasse, useEnvio } from './utilidades';
import { feriasApi, funcionariosApi } from '../../services/rh';
import type { Ferias, Funcionario } from '../../types/rh';

interface Props {
  item: Ferias | null;
  onClose: () => void;
  onSalvo: () => void;
}

export default function FeriasFormModal({ item, onClose, onSalvo }: Props) {
  const [funcionario, setFuncionario] = useState(item ? String(item.funcionario) : '');
  const [inicio, setInicio] = useState(item?.data_inicio ?? '');
  const [fim, setFim] = useState(item?.data_fim ?? '');
  const [observacoes, setObservacoes] = useState(item?.observacoes ?? '');
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const { salvando, erro, setErro, enviar } = useEnvio(onSalvo);

  useEffect(() => {
    funcionariosApi.listar().then(setFuncionarios).catch(() => setFuncionarios([]));
  }, []);

  const salvar = () => {
    if (!funcionario || !inicio || !fim) {
      setErro('Selecione o funcionário e informe as datas de início e fim.');
      return;
    }
    if (fim < inicio) {
      setErro('A data final não pode ser anterior à data inicial.');
      return;
    }
    const dados = { funcionario: Number(funcionario), data_inicio: inicio, data_fim: fim, observacoes };
    enviar(() => (item ? feriasApi.atualizar(item.id, dados) : feriasApi.criar(dados)));
  };

  return (
    <ModalBase
      titulo={item ? 'Editar férias' : 'Nova solicitação de férias'}
      onClose={onClose}
      onSubmit={salvar}
      salvando={salvando}
      erro={erro}
    >
      <div className="mb-3">
        <label className={labelClasse}>Funcionário</label>
        <SelectCampo className="w-full" value={funcionario} onChange={(e) => setFuncionario(e.target.value)}>
          <option value="">Selecione...</option>
          {funcionarios
            .filter((f) => f.status !== 'DESLIGADO' || String(f.id) === funcionario)
            .map((f) => (
              <option key={f.id} value={f.id}>
                {f.nome}
              </option>
            ))}
        </SelectCampo>
      </div>
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <label className={labelClasse}>Início</label>
          <input type="date" className={inputClasse} value={inicio} onChange={(e) => setInicio(e.target.value)} />
        </div>
        <div>
          <label className={labelClasse}>Fim</label>
          <input type="date" className={inputClasse} value={fim} onChange={(e) => setFim(e.target.value)} />
        </div>
      </div>
      <div>
        <label className={labelClasse}>Observações</label>
        <textarea className={inputClasse} rows={2} value={observacoes} onChange={(e) => setObservacoes(e.target.value)} />
      </div>
    </ModalBase>
  );
}