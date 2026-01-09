import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface PageHeaderProps {
    title: string;
    onBack?: () => void;
    rightAction?: {
        icon: string;
        onClick: () => void;
        title?: string;
    };
    showBackButton?: boolean;
    sticky?: boolean;
    showLogout?: boolean;
}

const PageHeader: React.FC<PageHeaderProps> = ({
    title,
    onBack,
    rightAction,
    showBackButton = true,
    sticky = false,
    showLogout = false
}) => {
    const navigate = useNavigate();
    const { signOut, user } = useAuth();

    const [logoutLoading, setLogoutLoading] = React.useState(false);

    const handleBack = () => {
        if (onBack) {
            onBack();
        } else {
            navigate(-1);
        }
    };

    const handleLogout = async () => {
        try {
            setLogoutLoading(true);
            await signOut();
            // AuthContext should trigger redirect via PrivateRoute, 
            // but we can also navigate explicitly for better UX
            navigate('/auth', { replace: true });
        } catch (error) {
            console.error('Logout error:', error);
            alert('Erro ao sair. Tente novamente.');
        } finally {
            setLogoutLoading(false);
        }
    };

    return (
        <header className={`${sticky ? 'sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-border' : ''} w-full px-4 py-4 flex items-center justify-between`}>
            {showBackButton ? (
                <button
                    onClick={handleBack}
                    className="flex size-10 items-center justify-center rounded-full hover:bg-white/10 transition-colors text-white active:scale-95"
                >
                    <span className="material-symbols-outlined text-2xl">arrow_back_ios_new</span>
                </button>
            ) : showLogout ? (
                <button
                    onClick={handleLogout}
                    disabled={logoutLoading}
                    className="flex size-10 items-center justify-center rounded-full hover:bg-danger/10 transition-colors text-danger active:scale-95 disabled:opacity-50"
                    title="Sair"
                >
                    {logoutLoading ? (
                        <div className="size-5 border-2 border-danger/20 border-t-danger rounded-full animate-spin"></div>
                    ) : (
                        <span className="material-symbols-outlined text-2xl">logout</span>
                    )}
                </button>
            ) : (
                <div className="size-10" />
            )}

            <div className="flex-1" />

            {rightAction ? (
                <button
                    onClick={rightAction.onClick}
                    className="flex size-10 items-center justify-center rounded-full hover:bg-white/10 transition-colors text-white active:scale-95"
                    title={rightAction.title}
                >
                    <span className="material-symbols-outlined text-2xl">{rightAction.icon}</span>
                </button>
            ) : (
                <div className="size-10" />
            )}
        </header>
    );
};

export default PageHeader;
