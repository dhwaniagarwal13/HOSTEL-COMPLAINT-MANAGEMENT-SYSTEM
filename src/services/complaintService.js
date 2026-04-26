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
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error("User not authenticated");
    }

    console.log("User:", user);
    console.log("User ID:", user?.id);

    const { data, error } = await supabase
        .from('complaints')
        .insert([{
            ...complaintData,
            user_id: user.id
        }])
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

export const getComplaintById = async (complaintId) => {
    const { data, error } = await supabase
        .from('complaints')
        .select('*, users!complaints_user_id_fkey(name, role, phone)')
        .eq('id', complaintId)
        .maybeSingle();

    if (error) throw error;
    return data;
};

export const updateComplaintStatus = async (complaintId, updates) => {
    // If status is resolved, set resolved_at
    if (updates.status === 'resolved' && !updates.resolved_at) {
        updates.resolved_at = new Date().toISOString();
    }
    
    const { data, error } = await supabase
        .from('complaints')
        .update(updates)
        .eq('id', complaintId)
        .select();

    if (error) throw error;
    return data;
};

// Auto Assign Helper
export const getStaffForCategory = async (category) => {
    // Basic logic: just pick the first available staff member.
    // In the future this can join against a staff_skills table.
    const { data, error } = await supabase
        .from('users')
        .select('id')
        .eq('role', 'staff')
        .limit(1)
        .maybeSingle();
        
    if (error) {
        console.error("Error auto-assigning staff", error);
        return null;
    }
    return data?.id || null;
};

// Comments Service
export const getComplaintComments = async (complaintId) => {
    const { data, error } = await supabase
        .from('comments')
        .select('*, users(name, role)')
        .eq('complaint_id', complaintId)
        .order('created_at', { ascending: true });

    if (error) throw error;
    return data;
};

export const addComment = async (complaintId, userId, message) => {
    const { data, error } = await supabase
        .from('comments')
        .insert([{ complaint_id: complaintId, user_id: userId, message }])
        .select();

    if (error) throw error;
    return data;
};

// Phase 3: Escalation Logic
export const checkAndEscalateComplaints = async (complaints) => {
    if(!complaints || complaints.length === 0) return false;
    const now = new Date().getTime();
    let escalatedAny = false;
    
    for (const c of complaints) {
        if (!c.deadline || c.escalated || c.status?.toLowerCase() === 'resolved') continue;
        
        const deadlineTime = new Date(c.deadline).getTime();
        if (now > deadlineTime) {
            try {
                await updateComplaintStatus(c.id, { escalated: true });
                escalatedAny = true;
            } catch (err) {
                console.error("Failed to auto-escalate complaint", c.id, err);
            }
        }
    }
    return escalatedAny;
};

// Phase 4: Feedback System
export const submitFeedback = async (complaintId, rating, comment) => {
    const feedbackObj = JSON.stringify({ rating, comment, timestamp: new Date().toISOString() });
    const { data, error } = await supabase
        .from('complaints')
        .update({ feedback: feedbackObj })
        .eq('id', complaintId)
        .select();

    if (error) throw error;
    return data;
};
