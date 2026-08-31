import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';

export default function Cadastro() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');

    if (password !== confirmarSenha) {
      setErro('As senhas não coincidem.');
      return;
    }

    setCarregando(true);
    try {
      await api.post('/usuarios/cadastro/', { username, email, password });
      navigate('/login');
    } catch {
      setErro('Não foi possível criar a conta. Verifique os dados.');
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="login-bg flex items-center justify-center p-8 relative overflow-hidden">
      <svg className="absolute inset-0 w-full h-full opacity-[0.18] pointer-events-none" viewBox="0 0 900 560" xmlns="http://www.w3.org/2000/svg">
        <circle cx="80" cy="120" r="2" fill="#fff" /><circle cx="150" cy="200" r="2" fill="#fff" /><circle cx="60" cy="300" r="2" fill="#fff" /><circle cx="200" cy="90" r="2" fill="#fff" /><circle cx="250" cy="250" r="2" fill="#fff" /><circle cx="120" cy="400" r="2" fill="#fff" /><circle cx="750" cy="150" r="2" fill="#fff" /><circle cx="800" cy="300" r="2" fill="#fff" /><circle cx="700" cy="420" r="2" fill="#fff" /><circle cx="830" cy="450" r="2" fill="#fff" />
        <path d="M80,120 L150,200 L60,300 L200,90 L250,250 L120,400" stroke="#fff" strokeWidth="1" fill="none" />
        <path d="M750,150 L800,300 L700,420 L830,450" stroke="#fff" strokeWidth="1" fill="none" />
      </svg>

      <form onSubmit={handleSubmit} className="glass-card rounded-2xl p-8 w-full max-w-sm relative">
        <h1 className="text-text-primary text-2xl font-bold font-sans mb-1">Criar conta</h1>
        <p className="text-text-secondary text-sm font-sans mb-6">Preencha os dados para começar</p>

        {erro && (
          <p className="text-danger text-sm font-sans mb-4">{erro}</p>
        )}

        <label className="text-text-secondary text-sm font-sans">Nome de usuário</label>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full mt-1 mb-3 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-text-primary font-sans outline-none focus:border-primary"
          required
        />

        <label className="text-text-secondary text-sm font-sans">E-mail</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full mt-1 mb-3 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-text-primary font-sans outline-none focus:border-primary"
          required
        />

        <label className="text-text-secondary text-sm font-sans">Senha</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full mt-1 mb-3 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-text-primary font-sans outline-none focus:border-primary"
          required
        />

        <label className="text-text-secondary text-sm font-sans">Confirmar senha</label>
        <input
          type="password"
          value={confirmarSenha}
          onChange={(e) => setConfirmarSenha(e.target.value)}
          className="w-full mt-1 mb-6 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-text-primary font-sans outline-none focus:border-primary"
          required
        />

        <button
          type="submit"
          disabled={carregando}
          className="w-full py-2 rounded-xl bg-primary text-white font-sans font-semibold hover:opacity-90 transition disabled:opacity-50"
        >
          {carregando ? 'Criando conta...' : 'Criar conta'}
        </button>

        <p className="text-text-secondary text-sm font-sans text-center mt-4">
          Já tem conta?{' '}
          <Link to="/login" className="text-accent-blue hover:underline">
            Fazer login
          </Link>
        </p>
      </form>
    </div>
  );
}