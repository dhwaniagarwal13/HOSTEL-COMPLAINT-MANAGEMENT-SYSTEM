import { supabase } from '../lib/supabase';

export const uploadImage = async (file) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `complaints/${fileName}`;

    const { error: uploadError } = await supabase.storage
        .from('complaint-images')
        .upload(filePath, file);

    if (uploadError) {
        throw uploadError;
    }

    const { data } = supabase.storage
        .from('complaint-images')
        .getPublicUrl(filePath);

    return data.publicUrl;
};

export const createComplaint = async (complaintData) => {
    const { data, error } = await supabase
        .from('complaints')
        .insert([complaintData])
        .select();

    if (error) {
        throw error;
    }

    return data;
};

export const getStudentComplaints = async (userId) => {
    const { data, error } = await supabase
        .from('complaints')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (error) {
        throw error;
    }

    return data;
};

export const getAllComplaints = async () => {
    const { data, error } = await supabase
        .from('complaints')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        throw error;
    }

    return data;
};
