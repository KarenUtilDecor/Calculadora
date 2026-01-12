import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';

const Auth: React.FC = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();
    const [connectionStatus, setConnectionStatus] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        // Timeout promise
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('A conexão demorou muito. Verifique sua internet e tente novamente.')), 10000);
        });

        try {
            if (isLogin) {
                const loginPromise = supabase.auth.signInWithPassword({
                    email,
                    password,
                });

                const { error } = await Promise.race([loginPromise, timeoutPromise]) as any;

                if (error) throw error;
                navigate('/');
            } else {
                const signUpPromise = supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: {
                            full_name: fullName,
                        },
                    },
                });

                const { error } = await Promise.race([signUpPromise, timeoutPromise]) as any;

                if (error) throw error;
                alert('Cadastro realizado! Se necessário, verifique seu e-mail.');
                setIsLogin(true);
            }
        } catch (err: any) {
            console.error('Erro no login/cadastro:', err);
            setError(err.message || 'Ocorreu um erro.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full bg-[#050505] flex items-center justify-center p-4 relative overflow-hidden font-sans">
            {/* Mesh Gradient Background Fragments */}
            <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/20 rounded-full blur-[140px] animate-pulse-slow"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-500/10 rounded-full blur-[140px] animate-pulse-slow font-delay-2000"></div>
            <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] bg-primary/10 rounded-full blur-[100px] animate-pulse-slow font-delay-4000"></div>

            {/* Glass Background Pattern */}
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none brightness-50 contrast-150"></div>

            <div className="w-full max-w-md z-10 animate-fade-in-up">
                <div className="text-center mb-10">
                    <div className="relative inline-block">
                        <div className="absolute inset-0 bg-primary/40 rounded-3xl blur-2xl animate-pulse"></div>
                        <div className="relative size-20 rounded-3xl bg-gradient-to-br from-primary/30 to-primary/10 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-glow shadow-primary/30">
                            <span className="material-symbols-outlined text-4xl text-white drop-shadow-lg">sell</span>
                        </div>
                    </div>
                    <h1 className="mt-8 text-4xl font-black text-white tracking-tighter sm:text-5xl">
                        Precifica <span className="text-primary italic">Pro</span>
                    </h1>
                    <p className="mt-2 text-text-sec text-sm font-medium tracking-wide uppercase">O futuro da sua precificação</p>
                </div>

                <div className="relative group">
                    {/* Shadow behind the card */}
                    <div className="absolute -inset-1 bg-gradient-to-r from-primary/50 to-indigo-500/50 rounded-[2.5rem] blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>

                    <div className="relative bg-white/[0.03] backdrop-blur-2xl rounded-[2rem] p-8 border border-white/10 shadow-3xl">
                        <div className="flex gap-2 mb-10 p-1.5 bg-black/40 rounded-2xl border border-white/5">
                            <button
                                onClick={() => setIsLogin(true)}
                                className={`flex-1 py-3.5 rounded-xl text-sm font-bold transition-all duration-500 ${isLogin
                                    ? 'bg-primary text-white shadow-xl shadow-primary/20 scale-[1.02]'
                                    : 'text-text-sec hover:text-white hover:bg-white/5'
                                    }`}
                            >
                                Entrar
                            </button>
                            <button
                                onClick={() => setIsLogin(false)}
                                className={`flex-1 py-3.5 rounded-xl text-sm font-bold transition-all duration-500 ${!isLogin
                                    ? 'bg-primary text-white shadow-xl shadow-primary/20 scale-[1.02]'
                                    : 'text-text-sec hover:text-white hover:bg-white/5'
                                    }`}
                            >
                                Cadastrar
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            {error && (
                                <div className="p-4 bg-danger/10 border border-danger/20 rounded-2xl flex items-center gap-3 text-danger text-sm font-bold animate-shake">
                                    <span className="material-symbols-outlined text-xl">error_outline</span>
                                    {error}
                                </div>
                            )}

                            {!isLogin && (
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-text-sec uppercase tracking-widest ml-1 opacity-70">Nome Completo</label>
                                    <div className="relative group/field">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-text-sec group-focus-within/field:text-primary transition-colors">
                                            <span className="material-symbols-outlined text-xl">person</span>
                                        </div>
                                        <input
                                            type="text"
                                            required
                                            value={fullName}
                                            onChange={(e) => setFullName(e.target.value)}
                                            className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder-white/20 focus:border-primary/50 focus:ring-4 focus:ring-primary/10 outline-none transition-all"
                                            placeholder="Seu nome"
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-text-sec uppercase tracking-widest ml-1 opacity-70">Seu Melhor E-mail</label>
                                <div className="relative group/field">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-text-sec group-focus-within/field:text-primary transition-colors">
                                        <span className="material-symbols-outlined text-xl">alternate_email</span>
                                    </div>
                                    <input
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder-white/20 focus:border-primary/50 focus:ring-4 focus:ring-primary/10 outline-none transition-all"
                                        placeholder="exemplo@email.com"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-text-sec uppercase tracking-widest ml-1 opacity-70">Sua Senha</label>
                                <div className="relative group/field">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-text-sec group-focus-within/field:text-primary transition-colors">
                                        <span className="material-symbols-outlined text-xl">lock_open</span>
                                    </div>
                                    <input
                                        type="password"
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder-white/20 focus:border-primary/50 focus:ring-4 focus:ring-primary/10 outline-none transition-all"
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full relative group/btn overflow-hidden rounded-2xl"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-primary to-indigo-600 transition-all duration-500 group-hover/btn:scale-110"></div>
                                <div className={`relative w-full py-4.5 text-white text-base font-black flex items-center justify-center gap-3 transition-all ${loading ? 'opacity-80' : 'group-active/btn:scale-95'}`}>
                                    {loading ? (
                                        <div className="size-6 border-3 border-white/20 border-t-white rounded-full animate-spin"></div>
                                    ) : (
                                        <>
                                            <span>{isLogin ? 'Iniciar Sessão' : 'Criar minha conta'}</span>
                                            <span className="material-symbols-outlined text-xl animate-bounce-x">arrow_forward</span>
                                        </>
                                    )}
                                </div>
                            </button>
                        </form>
                    </div>
                </div>

                <div className="text-center mt-12 space-y-4">
                    <p className="text-sm text-text-sec/60">
                        {isLogin ? 'Teve problemas para entrar?' : 'Já possui uma conta ativa?'}
                        <button
                            onClick={() => setIsLogin(!isLogin)}
                            className="text-primary font-bold ml-1.5 hover:text-primary-light transition-colors"
                        >
                            {isLogin ? 'Recuperar acesso' : 'Fazer login'}
                        </button>
                    </p>

                    <div className="flex flex-col items-center gap-3">
                        <button
                            onClick={async () => {
                                setConnectionStatus('Sincronizando...');
                                const start = performance.now();
                                try {
                                    const { error } = await supabase.from('profiles').select('count', { count: 'exact', head: true });
                                    const end = performance.now();
                                    const latency = Math.round(end - start);
                                    if (error && error.code !== 'PGRST116') {
                                        setConnectionStatus(`Falha: ${error.message} (${latency}ms)`);
                                    } else {
                                        setConnectionStatus(`Supabase Online • ${latency}ms`);
                                    }
                                } catch (err: any) {
                                    setConnectionStatus(`Offline: ${err.message}`);
                                }
                            }}
                            className="bg-white/[0.02] border border-white/5 px-4 py-2 rounded-full text-[10px] font-bold text-text-sec/40 hover:text-white hover:bg-white/10 hover:border-white/10 transition-all flex items-center gap-2 group/status"
                        >
                            <span className={`size-1.5 rounded-full ${connectionStatus?.includes('Falha') || connectionStatus?.includes('Offline') ? 'bg-error' : connectionStatus ? 'bg-success animate-pulse' : 'bg-text-sec/30'}`}></span>
                            {connectionStatus || 'Status do Servidor'}
                        </button>
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes fade-in-up {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes pulse-slow {
                    0%, 100% { transform: scale(1) translate(0, 0); opacity: 0.2; }
                    50% { transform: scale(1.1) translate(2% , 3%); opacity: 0.3; }
                }
                @keyframes bounce-x {
                    0%, 100% { transform: translateX(0); }
                    50% { transform: translateX(5px); }
                }
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    20%, 60% { transform: translateX(-4px); }
                    40%, 80% { transform: translateX(4px); }
                }
                .animate-fade-in-up { animation: fade-in-up 1s cubic-bezier(0.16, 1, 0.3, 1); }
                .animate-pulse-slow { animation: pulse-slow 8s ease-in-out infinite; }
                .animate-bounce-x { animation: bounce-x 1s ease-in-out infinite; }
                .animate-shake { animation: shake 0.4s cubic-bezier(.36,.07,.19,.97) both; }
                .font-delay-2000 { animation-delay: 2s; }
                .font-delay-4000 { animation-delay: 4s; }
                
                ::-webkit-scrollbar {
                    width: 5px;
                }
                ::-webkit-scrollbar-track {
                    background: transparent;
                }
                ::-webkit-scrollbar-thumb {
                    background: rgba(255,255,255,0.1);
                    border-radius: 10px;
                }
            `}</style>
        </div>
    );
};

export default Auth;
