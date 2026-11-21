import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const { signIn } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      await signIn(email, password);
      nav('/');
    } catch (err: any) {
      setError(err.message || 'Email o contraseña incorrectos');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm bg-white p-8 rounded-2xl shadow-lg space-y-4 border border-gray-100">
        
        <img src="/logo.png" alt="Logo Equis5" className="h-24 mx-auto object-contain mb-2" />
        
        <h1 className="text-2xl font-extrabold text-center text-black tracking-tight mb-6">
          Tareas de Equis5
        </h1>
        
        {error && <div className="bg-red-50 text-red-700 text-sm p-2 rounded text-center font-medium">{error}</div>}
        
        <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required
          className="w-full border border-gray-300 rounded-lg p-3" />
        
        <input type="password" placeholder="Contraseña" value={password} onChange={e => setPassword(e.target.value)} required
          className="w-full border border-gray-300 rounded-lg p-3" />
        
        <button disabled={loading} className="w-full bg-black text-white rounded-lg p-3 font-semibold hover:bg-gray-800 disabled:opacity-50">
          {loading ? 'Ingresando…' : 'Ingresar'}
        </button>
      </form>
    </div>
  );
}
