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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (isLogin) {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) throw error;
                navigate('/');
            } else {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: {
                            full_name: fullName,
                        },
                    },
                });
                if (error) throw error;
                alert('Cadastro realizado! Se necessário, verifique seu e-mail.');
                setIsLogin(true);
            }
        } catch (err: any) {
            setError(err.message || 'Ocorreu um erro.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full bg-background flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background Orbs */}
            <div className="absolute top-0 -left-20 w-80 h-80 bg-primary/10 rounded-full blur-[120px] pointer-events-none"></div>
            <div className="absolute bottom-0 -right-20 w-80 h-80 bg-primary/10 rounded-full blur-[120px] pointer-events-none"></div>

            <div className="w-full max-w-md z-10">
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center size-20 rounded-2xl bg-primary/20 text-primary mb-6 ring-1 ring-primary/30 shadow-glow shadow-primary/20">
                        <span className="material-symbols-outlined text-4xl">payments</span>
                    </div>
                    <h1 className="text-3xl font-extrabold text-white tracking-tight mb-2">Precifica Pro</h1>
                    <p className="text-text-sec">Gerencie seus lucros com inteligência</p>
                </div>

                <div className="bg-surface-card rounded-3xl p-8 border border-border shadow-2xl relative overflow-hidden">
                    <div className="flex gap-2 mb-8 p-1 bg-background rounded-2xl">
                        <button
                            onClick={() => setIsLogin(true)}
                            className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${isLogin ? 'bg-primary text-white shadow-lg' : 'text-text-sec hover:text-white'
                                }`}
                        >
                            Login
                        </button>
                        <button
                            onClick={() => setIsLogin(false)}
                            className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${!isLogin ? 'bg-primary text-white shadow-lg' : 'text-text-sec hover:text-white'
                                }`}
                        >
                            Cadastro
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {error && (
                            <div className="p-4 bg-danger/10 border border-danger/20 rounded-xl flex items-center gap-3 text-danger text-sm font-medium animate-shake">
                                <span className="material-symbols-outlined text-[20px]">error</span>
                                {error}
                            </div>
                        )}

                        {!isLogin && (
                            <div className="space-y-2">
                                <span className="text-xs font-bold text-text-sec uppercase tracking-widest ml-1">Nome Completo</span>
                                <div className="relative group">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-text-sec group-focus-within:text-primary transition-colors">
                                        <span className="material-symbols-outlined text-[20px]">person</span>
                                    </div>
                                    <input
                                        type="text"
                                        required
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        className="w-full bg-input-surface border border-border rounded-xl py-3.5 pl-12 pr-4 text-white placeholder-text-sec focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                                        placeholder="Seu nome"
                                    />
                                </div>
                            </div>
                        )}

                        <div className="space-y-2">
                            <span className="text-xs font-bold text-text-sec uppercase tracking-widest ml-1">Email</span>
                            <div className="relative group">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-text-sec group-focus-within:text-primary transition-colors">
                                    <span className="material-symbols-outlined text-[20px]">alternate_email</span>
                                </div>
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-input-surface border border-border rounded-xl py-3.5 pl-12 pr-4 text-white placeholder-text-sec focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                                    placeholder="seu@email.com"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <span className="text-xs font-bold text-text-sec uppercase tracking-widest ml-1">Senha</span>
                            <div className="relative group">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-text-sec group-focus-within:text-primary transition-colors">
                                    <span className="material-symbols-outlined text-[20px]">lock</span>
                                </div>
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-input-surface border border-border rounded-xl py-3.5 pl-12 pr-4 text-white placeholder-text-sec focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-primary hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed text-white text-base font-bold py-4 rounded-xl shadow-lg shadow-primary/20 transition-all hover:-translate-y-1 active:scale-[0.98] flex items-center justify-center gap-2 mt-4"
                        >
                            {loading ? (
                                <div className="size-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            ) : (
                                <>
                                    <span>{isLogin ? 'Entrar Agora' : 'Criar Conta'}</span>
                                    <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                                </>
                            )}
                        </button>
                    </form>
                </div>

                <p className="text-center mt-8 text-sm text-text-sec">
                    {isLogin ? 'Esqueceu sua senha?' : 'Ao se cadastrar você aceita nossos termos.'}
                    <button className="text-primary font-bold ml-1 hover:underline">Saiba mais</button>
                </p>
            </div>

            <style>{`
                @keyframes animate-shake {
                    0%, 100% { transform: translateX(0); }
                    25% { transform: translateX(-5px); }
                    75% { transform: translateX(5px); }
                }
                .animate-shake {
                    animation: animate-shake 0.3s ease-in-out;
                }
            `}</style>
        </div>
    );
};

export default Auth;
