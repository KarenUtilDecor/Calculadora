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
        const checkApproval = async (user: User | null) => {
            if (!user) return true;

            try {
                const { data, error } = await supabase
                    .from('profiles')
                    .select('approved')
                    .eq('id', user.id)
                    .single();

                if (error || !data || data.approved === false) {
                    await supabase.auth.signOut();
                    return false;
                }
                return true;
            } catch (err) {
                await supabase.auth.signOut();
                return false;
            }
        };

        const initAuth = async () => {
            const { data: { session } } = await supabase.auth.getSession();
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
            setLoading(false);
        };

        initAuth();

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
