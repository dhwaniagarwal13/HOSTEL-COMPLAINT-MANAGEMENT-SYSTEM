import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchProfile = async (userId) => {
        try {
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('id', userId)
                .maybeSingle(); // Use maybeSingle to avoid 406 errors if row isn't there yet
            
            if (error) throw error;
            setProfile(data || null);
        } catch (error) {
            console.error("Profile fetch error:", error.message);
            setProfile(null);
        }
    };

    useEffect(() => {
        let mounted = true;

        const initializeAuth = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (!mounted) return;

                const currentUser = session?.user || null;
                setUser(currentUser);

                if (currentUser) {
                    const { data: prof } = await supabase
                        .from('users')
                        .select('*')
                        .eq('id', currentUser.id)
                        .maybeSingle();
                    if (mounted) setProfile(prof);
                }
                
                if (mounted) setLoading(false);
            } catch (error) {
                console.error("Auth init error:", error);
                if (mounted) setLoading(false);
            }
        };

        initializeAuth();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (!mounted) return;
            
            const currentUser = session?.user || null;
            setUser(currentUser);

            if (currentUser) {
                supabase.from('users').select('*').eq('id', currentUser.id).maybeSingle()
                    .then(({ data: prof }) => {
                        if (mounted) {
                            setProfile(prof);
                            setLoading(false);
                        }
                    });
            } else {
                setProfile(null);
                setLoading(false);
            }
        });

        return () => {
            mounted = false;
            subscription.unsubscribe();
        };
    }, []);

    const value = {
        user,
        profile,
        loading
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
