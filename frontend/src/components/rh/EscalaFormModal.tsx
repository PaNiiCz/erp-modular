import { useEffect, useState } from 'react';
import ModalBase from './ModalBase';
import SelectCampo from '../SelectCampo';
import { diasSemana, formatarHora, inputClasse, labelClasse, useEnvio } from './utilidades';
import { escalasApi, funcionariosApi } from '../../services/rh';
import type { Escala, Funcionario } from '../../types/rh';

interface Props {
  item: Escala | null;
  onClose: () => void;
  onSalvo: () => void;
}

export default function EscalaFormModal({ item, onClose, onSalvo }: Props) {
  const [funcionario, setFuncionario] = useState(item ? String(item.funcionario) : '');
  const [dia, setDia] = useState(item ? String(item.dia_semana) : '0');
  const [entrada, setEntrada] = useState(item ? formatarHora(item.hora_inicio) : '08:00');
  const [saida, setSaida] = useState(item ? formatarHora(item.hora_fim) : '17:00');
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const { salvando, erro, setErro, enviar } = useEnvio(onSalvo);

  useEffect(() => {
    funcionariosApi.listar().then(setFuncionarios).catch(() => setFuncionarios([]));
  }, []);

  const salvar = () => {
    if (!funcionario || !entrada || !saida) {
      setErro('Selecione o funcionário e informe os horários.');
      return;
    }
    if (saida <= entrada) {
      setErro('O horário de saída deve ser depois do horário de entrada.');
      return;
    }
    const dados = {
      funcionario: Number(funcionario),
      dia_semana: Number(dia),
      hora_inicio: entrada,
      hora_fim: saida,
    };
    enviar(() => (item ? escalasApi.atualizar(item.id, dados) : escalasApi.criar(dados)));
  };

  return (
    <ModalBase
      titulo={item ? 'Editar escala' : 'Nova escala'}
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
      <div className="mb-3">
        <label className={labelClasse}>Dia da semana</label>
        <SelectCampo className="w-full" value={dia} onChange={(e) => setDia(e.target.value)}>
          {diasSemana.map((nome, indice) => (
            <option key={nome} value={indice}>
              {nome}
            </option>
          ))}
        </SelectCampo>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClasse}>Entrada</label>
          <input type="time" className={inputClasse} value={entrada} onChange={(e) => setEntrada(e.target.value)} />
        </div>
        <div>
          <label className={labelClasse}>Saída</label>
          <input type="time" className={inputClasse} value={saida} onChange={(e) => setSaida(e.target.value)} />
        </div>
      </div>
    </ModalBase>
  );
}