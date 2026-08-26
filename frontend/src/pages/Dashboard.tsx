import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import CardResumo from '../components/dashboard/CardResumo';
import GraficoVendas from '../components/dashboard/GraficoVendas';
import ProdutosMaisVendidos from '../components/dashboard/ProdutosMaisVendidos';
import AtividadesRecentes from '../components/dashboard/AtividadesRecentes';
import { getResumo, getProdutosMaisVendidos, getGraficoVendas, getAtividadesRecentes } from '../services/dashboard';
import type { ResumoDashboard, ProdutoMaisVendido, VendaPorDia, AtividadeRecente } from '../types/dashboard';

export default function Dashboard() {
  const [resumo, setResumo] = useState<ResumoDashboard | null>(null);
  const [produtos, setProdutos] = useState<ProdutoMaisVendido[]>([]);
  const [grafico, setGrafico] = useState<VendaPorDia[]>([]);
  const [atividades, setAtividades] = useState<AtividadeRecente[]>([]);

  useEffect(() => {
    getResumo().then(setResumo);
    getProdutosMaisVendidos().then(setProdutos);
    getGraficoVendas(14).then(setGrafico);
    getAtividadesRecentes().then(setAtividades);
  }, []);

  const fadeIn = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
  };

  return (
    <div className="app-bg p-8">
      <h1 className="text-text-primary text-2xl font-bold font-sans mb-6">Dashboard</h1>

      {resumo && (
        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6"
          initial="initial"
          animate="animate"
          transition={{ staggerChildren: 0.1 }}
        >
          <motion.div variants={fadeIn}><CardResumo titulo="Faturamento" valor={`R$ ${resumo.faturamento_mes}`} /></motion.div>
          <motion.div variants={fadeIn}><CardResumo titulo="Lucro" valor={`R$ ${resumo.lucro_mes}`} destaque={parseFloat(resumo.lucro_mes) >= 0 ? 'positivo' : 'negativo'} /></motion.div>
          <motion.div variants={fadeIn}><CardResumo titulo="Vendas do mês" valor={`${resumo.total_vendas_mes}`} /></motion.div>
          <motion.div variants={fadeIn}><CardResumo titulo="A pagar" valor={`R$ ${resumo.contas_a_pagar}`} destaque="negativo" /></motion.div>
          <motion.div variants={fadeIn}><CardResumo titulo="A receber" valor={`R$ ${resumo.contas_a_receber}`} destaque="positivo" /></motion.div>
          <motion.div variants={fadeIn}><CardResumo titulo="Clientes ativos" valor={`${resumo.clientes_ativos}`} /></motion.div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <GraficoVendas dados={grafico} />
        </div>
        <ProdutosMaisVendidos produtos={produtos} />
      </div>

      <div className="mt-4">
        <AtividadesRecentes atividades={atividades} />
      </div>
    </div>
  );
}