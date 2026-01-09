import React, { createContext, useContext, useState, useEffect } from 'react';
import { HashRouter, Routes, Route, useLocation, useNavigate, Navigate } from 'react-router-dom';
import Calculator from './pages/Calculator';
import Results from './pages/Results';
import SavedProducts from './pages/SavedProducts';
import Auth from './pages/Auth';
import { ProductData, CalculationResult } from './types';
import { AuthProvider, useAuth } from './contexts/AuthContext';

// --- Context Setup ---
interface AppContextType {
    currentProduct: ProductData | null;
    setCurrentProduct: (p: ProductData) => void;
    currentResult: CalculationResult | null;
    setCurrentResult: (r: CalculationResult) => void;
    savedResults: CalculationResult[];
    saveResult: (r: CalculationResult) => void;
    deleteResult: (id: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useApp = () => {
    const context = useContext(AppContext);
    if (!context) throw new Error("useApp must be used within AppProvider");
    return context;
};

const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [currentProduct, setCurrentProduct] = useState<ProductData | null>(null);
    const [currentResult, setCurrentResult] = useState<CalculationResult | null>(null);
    const [savedResults, setSavedResults] = useState<CalculationResult[]>([]);

    const saveResult = (result: CalculationResult) => {
        setSavedResults(prev => [result, ...prev]);
    };

    const deleteResult = (id: string) => {
        setSavedResults(prev => prev.filter(r => r.product.id !== id));
    };

    return (
        <AppContext.Provider value={{
            currentProduct,
            setCurrentProduct,
            currentResult,
            setCurrentResult,
            savedResults,
            saveResult,
            deleteResult
        }}>
            {children}
        </AppContext.Provider>
    );
};

// --- Private Route ---
const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="size-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/auth" replace />;
    }

    return <>{children}</>;
};

// --- Sidebar Context ---
interface SidebarContextType {
    isCollapsed: boolean;
    toggleSidebar: () => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

const SidebarProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const toggleSidebar = () => setIsCollapsed(prev => !prev);

    return (
        <SidebarContext.Provider value={{ isCollapsed, toggleSidebar }}>
            {children}
        </SidebarContext.Provider>
    );
};

export const useSidebar = () => {
    const context = useContext(SidebarContext);
    if (!context) throw new Error("useSidebar must be used within SidebarProvider");
    return context;
};

const Sidebar = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, signOut } = useAuth();
    const { isCollapsed, toggleSidebar } = useSidebar();
    const [profileImage, setProfileImage] = useState(localStorage.getItem('user_profile_image') || '');
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const handleImageClick = () => {
        fileInputRef.current?.click();
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64 = reader.result as string;
                setProfileImage(base64);
                localStorage.setItem('user_profile_image', base64);
            };
            reader.readAsDataURL(file);
        }
    };

    if (!user || location.pathname === '/auth') return null;

    const isActive = (path: string) => location.pathname === path;

    return (
        <aside
            className={`hidden lg:flex flex-col bg-surface-card border-r border-border min-h-screen sticky top-0 transition-all duration-300 ease-in-out ${isCollapsed ? 'w-20' : 'w-64'
                }`}
        >
            <div className={`p-6 flex items-center gap-3 ${isCollapsed ? 'justify-center' : ''}`}>
                <div className="size-10 min-w-[40px] rounded-xl bg-primary/20 text-primary flex items-center justify-center ring-1 ring-primary/30 shadow-glow shadow-primary/20">
                    <span className="material-symbols-outlined">payments</span>
                </div>
                {!isCollapsed && <h1 className="text-xl font-extrabold text-white tracking-tight truncate">Precifica Pro</h1>}
            </div>

            <nav className="flex-1 px-4 py-6 flex flex-col gap-2">
                <button
                    onClick={() => navigate('/')}
                    title="Calculadora"
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${isActive('/') ? 'bg-primary text-white shadow-lg' : 'text-text-sec hover:text-white hover:bg-white/5'
                        } ${isCollapsed ? 'justify-center px-0' : ''}`}
                >
                    <span className={`material-symbols-outlined ${isActive('/') ? 'filled' : ''}`}>calculate</span>
                    {!isCollapsed && <span className="truncate">Calculadora</span>}
                </button>
                <button
                    onClick={() => navigate('/saved')}
                    title="Produtos Salvos"
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${isActive('/saved') ? 'bg-primary text-white shadow-lg' : 'text-text-sec hover:text-white hover:bg-white/5'
                        } ${isCollapsed ? 'justify-center px-0' : ''}`}
                >
                    <span className={`material-symbols-outlined ${isActive('/saved') ? 'filled' : ''}`}>inventory_2</span>
                    {!isCollapsed && <span className="truncate">Produtos Salvos</span>}
                </button>
            </nav>

            <div className="p-4 mt-auto border-t border-border flex flex-col gap-2">
                <button
                    onClick={toggleSidebar}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-text-sec hover:text-white hover:bg-white/5 transition-all mb-2 ${isCollapsed ? 'justify-center px-0' : ''
                        }`}
                    title={isCollapsed ? "Expandir" : "Recolher"}
                >
                    <span className="material-symbols-outlined transition-transform duration-300" style={{ transform: isCollapsed ? 'rotate(180deg)' : 'none' }}>
                        side_navigation
                    </span>
                    {!isCollapsed && <span>Recolher</span>}
                </button>

                {!isCollapsed ? (
                    <div className="flex items-center gap-3 mb-4 px-2">
                        <div
                            onClick={handleImageClick}
                            className="size-8 min-w-[32px] rounded-full bg-primary/10 flex items-center justify-center text-primary border border-primary/20 overflow-hidden cursor-pointer hover:opacity-80 transition-opacity relative group"
                        >
                            {profileImage ? (
                                <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                <span className="material-symbols-outlined text-sm">person</span>
                            )}
                            <div className="absolute inset-0 bg-black/40 hidden group-hover:flex items-center justify-center">
                                <span className="material-symbols-outlined text-[10px] text-white">edit</span>
                            </div>
                        </div>
                        <div className="flex flex-col min-w-0">
                            <span className="text-xs font-bold text-white truncate">{user.email?.split('@')[0]}</span>
                            <span className="text-[10px] text-text-sec truncate">{user.email}</span>
                        </div>
                    </div>
                ) : (
                    <div className="flex justify-center mb-4">
                        <div
                            onClick={handleImageClick}
                            className="size-8 rounded-full bg-primary/10 flex items-center justify-center text-primary border border-primary/20 overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                            title="Alterar foto"
                        >
                            {profileImage ? (
                                <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                <span className="material-symbols-outlined text-sm">person</span>
                            )}
                        </div>
                    </div>
                )}
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageChange}
                    className="hidden"
                    accept="image/*"
                />

                <button
                    onClick={() => {
                        if (window.confirm('Deseja sair?')) {
                            signOut();
                            navigate('/auth');
                        }
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-danger hover:bg-danger/10 transition-all ${isCollapsed ? 'justify-center px-0' : ''
                        }`}
                    title="Sair"
                >
                    <span className="material-symbols-outlined">logout</span>
                    {!isCollapsed && <span>Sair</span>}
                </button>
            </div>
        </aside>
    );
};

// --- Layout & Navigation ---
const BottomNav = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();

    if (!user || location.pathname === '/auth') return null;

    const isActive = (path: string) => location.pathname === path;

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-xl border-t border-border lg:hidden">
            <div className="flex justify-around items-center p-3">
                <button
                    onClick={() => navigate('/')}
                    className={`flex flex-col items-center gap-1 ${isActive('/') ? 'text-primary' : 'text-text-sec'}`}
                >
                    <span className={`material-symbols-outlined ${isActive('/') ? 'filled' : ''}`}>calculate</span>
                    <span className="text-[10px] font-bold">Calcular</span>
                </button>
                <button
                    onClick={() => navigate('/saved')}
                    className={`flex flex-col items-center gap-1 ${isActive('/saved') ? 'text-primary' : 'text-text-sec'}`}
                >
                    <span className={`material-symbols-outlined ${isActive('/saved') ? 'filled' : ''}`}>inventory_2</span>
                    <span className="text-[10px) font-bold">Salvos</span>
                </button>
            </div>
        </div>
    );
};

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const isAuthPage = useLocation().pathname === '/auth';

    return (
        <div className="min-h-screen w-full bg-background flex">
            {user && !isAuthPage && <Sidebar />}
            <main className="flex-1 flex flex-col pb-20 lg:pb-0 relative overflow-x-hidden">
                {children}
                <BottomNav />
            </main>
        </div>
    );
};

const App = () => {
    return (
        <AuthProvider>
            <SidebarProvider>
                <AppProvider>
                    <HashRouter>
                        <Layout>
                            <Routes>
                                <Route path="/auth" element={<Auth />} />
                                <Route path="/" element={<PrivateRoute><Calculator /></PrivateRoute>} />
                                <Route path="/results" element={<PrivateRoute><Results /></PrivateRoute>} />
                                <Route path="/saved" element={<PrivateRoute><SavedProducts /></PrivateRoute>} />
                            </Routes>
                        </Layout>
                    </HashRouter>
                </AppProvider>
            </SidebarProvider>
        </AuthProvider>
    );
};

export default App;
