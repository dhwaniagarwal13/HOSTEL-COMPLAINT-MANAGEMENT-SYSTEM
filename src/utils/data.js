// Storage Key
const STORAGE_KEY = 'hostel_complaints_db_adv';

export const HOSTEL_LIST = [
    "M-Block Hostel",
    "Senbegam Hostel",
    "ESQ-A Hostel",
    "ESQ-B Hostel",
    "Kalpana Chawla Hostel",
    "Meenakshi Hostel",
    "Malligai Hostel",
    "Thamarai Hostel",
    "Sanasi-C Hostel",
    "Paari Hostel",
    "Kaari Hostel",
    "Oori Hostel",
    "Adhiyaman Hostel",
    "Nelson Mandela Hostel",
    "Mullai Hostel",
    "Sannasi-A Hostel",
    "Agasthiyan Hostel",
    "Began Hostel",
    "International Hostel",
    "Green Pearl Hostel"
];

// Initial Mock DB identical to app.js
const INITIAL_DATA = [
    {
        id: 'CMP-001', studentId: 'S2023001', studentName: 'John Doe', roomNo: 'Block A - 101',
        category: 'Plumbing', subCategory: 'Leaking Pipe', location: 'Washroom',
        description: 'The pipe under the sink has been leaking constantly. It has started to flood the floor.',
        urgency: 'Extreme', status: 'In Progress', date: new Date(Date.now() - 86400000 * 2).toISOString(),
        assignedStaff: { name: 'Mike Smith', role: 'Head Plumber', phone: '+1 234 567 8901', rating: '4.8' },
        timeline: [
            { status: 'Submitted', date: new Date(Date.now() - 86400000 * 2).toISOString(), note: 'System generated.' },
            { status: 'Assigned', date: new Date(Date.now() - 86400000 * 1.5).toISOString(), note: 'Assigned to Mike Smith by Admin.' },
            { status: 'In Progress', date: new Date(Date.now() - 86400000 * 1).toISOString(), note: 'Awaiting spare pipe.' }
        ],
        chat: [
            { sender: 'student', name: 'John Doe', text: 'Hi, any update on this?', date: new Date(Date.now() - 86400000 * 1.2).toISOString() },
            { sender: 'staff', name: 'Mike Smith', text: 'Waiting on the warehouse to send the new pipe module. Expected today.', date: new Date(Date.now() - 86400000 * 1).toISOString() }
        ]
    },
    {
        id: 'CMP-002', studentId: 'S2023045', studentName: 'Alice Green', roomNo: 'Block B - 204',
        category: 'Electrical', subCategory: 'Broken Socket', location: 'Near bed',
        description: 'Sparks fly when I plug in my laptop.',
        urgency: 'High', status: 'Submitted', date: new Date(Date.now() - 3600000 * 5).toISOString(),
        assignedStaff: null, timeline: [{ status: 'Submitted', date: new Date(Date.now() - 3600000 * 5).toISOString(), note: 'System generated.' }],
        chat: []
    },
    {
        id: 'CMP-003', studentId: 'S2023089', studentName: 'Bob Builder', roomNo: 'Block C - 301',
        category: 'Furniture', subCategory: 'Broken Chair', location: 'Study desk',
        description: 'Chair leg is wobbly and broke off.',
        urgency: 'Normal', status: 'Resolved', date: new Date(Date.now() - 86400000 * 5).toISOString(),
        assignedStaff: { name: 'Dave Wood', role: 'Carpenter', phone: 'N/A', rating: '4.5' },
        timeline: [
            { status: 'Submitted', date: new Date(Date.now() - 86400000 * 5).toISOString(), note: 'System.' },
            { status: 'Resolved', date: new Date(Date.now() - 86400000 * 4).toISOString(), note: 'Chair replaced with new stock.' }
        ],
        chat: []
    }
];

export function getComplaints() {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_DATA));
        return INITIAL_DATA;
    }
    return JSON.parse(data);
}

export function saveComplaint(complaint) {
    const complaints = getComplaints();
    const existingIndex = complaints.findIndex(c => c.id === complaint.id);
    if (existingIndex > -1) complaints[existingIndex] = complaint;
    else complaints.push(complaint);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(complaints));
}

export function getComplaintById(id) {
    return getComplaints().find(c => c.id === id);
}

// Helpers
export function formatDate(isoString) {
    if (!isoString) return 'N/A';
    const d = new Date(isoString);
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit' });
}

export function addTimelineEvent(complaintId, status, note) {
    const c = getComplaintById(complaintId);
    if(c) {
        c.status = status;
        if (!c.timeline) c.timeline = [];
        c.timeline.push({ status, note, date: new Date().toISOString() });
        saveComplaint(c);
        return c;
    }
    return null;
}

export function addChatMessage(complaintId, text) {
    const complaint = getComplaintById(complaintId);
    if (!complaint) return;

    // temporarily disable user usage
}
