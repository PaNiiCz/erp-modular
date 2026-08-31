import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { login } from '../services/auth';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    setCarregando(true);
    try {
      await login(username, password);
      navigate('/dashboard');
    } catch {
      setErro('Usuário ou senha inválidos.');
    } finally {
      setCarregando(false);
    }
  };

  const loginGithub = () => {
    window.location.href = 'http://127.0.0.1:8000/auth/login/github/';
  };

  const loginGoogle = () => {
    window.location.href = 'http://127.0.0.1:8000/auth/login/google-oauth2/';
  };

  return (
    <div className="login-bg flex items-center justify-center p-8 relative overflow-hidden">
      <svg className="absolute inset-0 w-full h-full opacity-[0.18] pointer-events-none" viewBox="0 0 900 560" xmlns="http://www.w3.org/2000/svg">
        <circle cx="80" cy="120" r="2" fill="#fff" /><circle cx="150" cy="200" r="2" fill="#fff" /><circle cx="60" cy="300" r="2" fill="#fff" /><circle cx="200" cy="90" r="2" fill="#fff" /><circle cx="250" cy="250" r="2" fill="#fff" /><circle cx="120" cy="400" r="2" fill="#fff" /><circle cx="750" cy="150" r="2" fill="#fff" /><circle cx="800" cy="300" r="2" fill="#fff" /><circle cx="700" cy="420" r="2" fill="#fff" /><circle cx="830" cy="450" r="2" fill="#fff" />
        <path d="M80,120 L150,200 L60,300 L200,90 L250,250 L120,400" stroke="#fff" strokeWidth="1" fill="none" />
        <path d="M750,150 L800,300 L700,420 L830,450" stroke="#fff" strokeWidth="1" fill="none" />
      </svg>

      <form onSubmit={handleSubmit} className="glass-card rounded-2xl p-8 w-full max-w-sm relative">
        <h1 className="text-text-primary text-2xl font-bold font-sans mb-6">ERP Modular</h1>

        {erro && (
          <p className="text-danger text-sm font-sans mb-4">{erro}</p>
        )}

        <label className="text-text-secondary text-sm font-sans">Usuário</label>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full mt-1 mb-4 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-text-primary font-sans outline-none focus:border-primary"
          required
        />

        <label className="text-text-secondary text-sm font-sans">Senha</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full mt-1 mb-6 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-text-primary font-sans outline-none focus:border-primary"
          required
        />

        <button
          type="submit"
          disabled={carregando}
          className="w-full py-2 rounded-xl bg-primary text-white font-sans font-semibold hover:opacity-90 transition disabled:opacity-50"
        >
          {carregando ? 'Entrando...' : 'Entrar'}
        </button>

        <p className="text-text-secondary text-sm font-sans text-center mt-4">
          Não tem conta?{' '}
          <Link to="/cadastro" className="text-accent-blue hover:underline">
            Criar conta
          </Link>
        </p>

        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px bg-white/10" />
          <span className="text-text-secondary text-xs font-sans">Outras opções de login</span>
          <div className="flex-1 h-px bg-white/10" />
        </div>

        <div className="flex justify-center gap-4">
          <button
            type="button"
            onClick={loginGoogle}
            className="w-11 h-11 rounded-full glass-card flex items-center justify-center hover:scale-105 transition"
            aria-label="Entrar com Google"
          >
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
          </button>

          <button
            type="button"
            onClick={loginGithub}
            className="w-11 h-11 rounded-full glass-card flex items-center justify-center hover:scale-105 transition"
            aria-label="Entrar com GitHub"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="#ffffff">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
            </svg>
          </button>
        </div>
      </form>
    </div>
  );
}