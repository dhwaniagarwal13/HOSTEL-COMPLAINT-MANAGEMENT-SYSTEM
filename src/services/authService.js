import { supabase } from '../lib/supabase';

// Returns the active user session directly (fetches without external DB queries)
export const getCurrentUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.user || null;
};

export const login = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
    });
    if (error) throw error;

    // Immediately fetch profile to save time
    const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('id', data.user.id)
        .maybeSingle();

    return { user: data.user, profile };
};

export const uploadProfileImage = async (file) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
        .from('profiles')
        .upload(filePath, file);

    if (uploadError) {
        throw uploadError;
    }

    const { data } = supabase.storage
        .from('profiles')
        .getPublicUrl(filePath);

    return data.publicUrl;
};

export const signUp = async (email, password, userData) => {
    const { data, error } = await supabase.auth.signUp({
        email,
        password
    });
    if (error) throw error;

    if (data.user) {
        const { error: dbError } = await supabase.from('users').upsert({
            id: data.user.id,
            email: email,
            ...userData
        });
        if (dbError) throw dbError;
    }

    return data;
};

export const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
};
