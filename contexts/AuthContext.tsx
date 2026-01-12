import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface AuthContextType {
    user: User | null;
    session: Session | null;
    loading: boolean;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkApproval = async (user: User | null): Promise<boolean> => {
            if (!user) return true;

            try {
                const { data, error } = await supabase
                    .from('profiles')
                    .select('approved')
                    .eq('id', user.id)
                    .single();

                // Se houver erro de rede ou banco, permitir o login para não bloquear o usuário
                if (error) {
                    console.warn('Erro ao verificar aprovação:', error);
                    // Se o perfil não existe (PGRST116), podemos criar depois, mas permitir login
                    if (error.code === 'PGRST116') {
                        return true; // Perfil não existe, mas permite login
                    }
                    return true; // Outros erros também permitem login para não travar
                }

                // Só bloqueia se o usuário explicitamente não for aprovado
                if (data && data.approved === false) {
                    return false;
                }

                return true;
            } catch (err) {
                console.error('Exceção ao verificar aprovação:', err);
                return true; // Em caso de exceção, permite login para não travar
            }
        };

        const initAuth = async () => {
            try {
                const { data: { session }, error } = await supabase.auth.getSession();
                if (error) throw error;

                if (session?.user) {
                    const isApproved = await checkApproval(session.user);
                    if (isApproved) {
                        setSession(session);
                        setUser(session.user);
                    } else {
                        setSession(null);
                        setUser(null);
                    }
                }
            } catch (error) {
                console.error('Erro na inicialização da auth:', error);
                // Não desconectamos aqui para permitir que o usuário tente login novamente se for erro de rede
            } finally {
                setLoading(false);
            }
        };

        // Timeout de segurança: desativa loading após 5 segundos mesmo se houver problemas
        const timeoutId = setTimeout(() => {
            console.warn('Auth initialization timeout - forcing loading to false');
            setLoading(false);
        }, 5000);

        initAuth().finally(() => clearTimeout(timeoutId));

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === 'SIGNED_IN' && session?.user) {
                const isApproved = await checkApproval(session.user);
                if (!isApproved) {
                    setSession(null);
                    setUser(null);
                    alert('Sua conta aguarda aprovação do administrador.');
                } else {
                    setSession(session);
                    setUser(session.user);
                }
            } else if (event === 'SIGNED_OUT') {
                setSession(null);
                setUser(null);
            } else {
                setSession(session);
                setUser(session?.user ?? null);
            }
            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    const signOut = async () => {
        await supabase.auth.signOut();
    };

    return (
        <AuthContext.Provider value={{ user, session, loading, signOut }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
