// Mock Database using LocalStorage
const STORAGE_KEY = 'hostel_complaints_adv_data';
const USER_KEY = 'hostel_current_user_adv';

const INITIAL_DATA = [
    {
        id: 'CMP-001',
        title: 'Leaking tap in washroom',
        description: 'The tap has been leaking constantly since yesterday evening.',
        category: 'Plumbing',
        location: 'Block A, Washroom 3',
        urgency: 'Extreme',
        status: 'In Progress',
        date: new Date(Date.now() - 86400000).toISOString(),
        studentId: 'ST-001',
        studentName: 'John Doe',
        roomNo: 'A-302',
        image: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80&w=400',
        assignedStaff: {
            name: 'Mike Smith',
            role: 'Senior Plumber',
            phone: '+1 234 567 8900',
            rating: '4.8/5'
        },
        timeline: [
            { status: 'Submitted', date: new Date(Date.now() - 86400000).toISOString(), note: 'Complaint filed' },
            { status: 'Assigned', date: new Date(Date.now() - 50000000).toISOString(), note: 'Assigned to Mike Smith' },
            { status: 'In Progress', date: new Date(Date.now() - 20000000).toISOString(), note: 'Staff visited and identified the issue' }
        ],
        chat: [
            { sender: 'staff', name: 'Mike Smith', text: 'I will be coming in 10 mins to check.', date: new Date(Date.now() - 15000000).toISOString() },
            { sender: 'student', name: 'John Doe', text: 'Okay, I am in the room.', date: new Date(Date.now() - 14000000).toISOString() }
        ]
    },
    {
        id: 'CMP-002',
        title: 'WiFi Router not working',
        description: 'No internet connection since morning.',
        category: 'Internet',
        location: 'Block C, Room 105',
        urgency: 'Normal',
        status: 'Pending',
        date: new Date(Date.now() - 172800000).toISOString(),
        studentId: 'ST-002',
        studentName: 'Alice Smith',
        roomNo: 'C-105',
        image: null,
        assignedStaff: null,
        timeline: [
            { status: 'Submitted', date: new Date(Date.now() - 172800000).toISOString(), note: 'Complaint filed' }
        ],
        chat: []
    },
    {
        id: 'CMP-003',
        title: 'Broken window latch',
        description: 'Window does not lock properly, compromising security.',
        category: 'Furniture',
        location: 'Block B, Room 210',
        urgency: 'Mild',
        status: 'Resolved',
        date: new Date(Date.now() - 432000000).toISOString(),
        studentId: 'ST-001',
        studentName: 'John Doe',
        roomNo: 'B-210',
        image: null,
        assignedStaff: {
            name: 'Dave Carpenter',
            role: 'Maintenance',
            phone: '+1 987 654 3210',
            rating: '4.5/5'
        },
        timeline: [
            { status: 'Submitted', date: new Date(Date.now() - 432000000).toISOString(), note: 'Complaint filed' },
            { status: 'Resolved', date: new Date(Date.now() - 100000000).toISOString(), note: 'Latch replaced.' }
        ],
        chat: []
    }
];

// Initialize DB
function initDB() {
    if (!localStorage.getItem(STORAGE_KEY)) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_DATA));
    }
}

// Get all complaints
function getComplaints() {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
}

// Get complaint by ID
function getComplaintById(id) {
    const complaints = getComplaints();
    return complaints.find(c => c.id === id);
}

// Save or Update Complaint
function saveComplaint(complaint) {
    const complaints = getComplaints();
    const existingIndex = complaints.findIndex(c => c.id === complaint.id);
    
    if (existingIndex >= 0) {
        complaints[existingIndex] = complaint;
    } else {
        complaints.unshift(complaint);
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(complaints));
}

// Removed legacy auth: loginUser, getCurrentUser, logout, requireAuth

// UI Helpers
function getStatusBadge(status) {
    const s = status.toLowerCase().replace(' ', '');
    return `<span class="badge badge-${s}">${status}</span>`;
}

function getUrgencyBadge(urgency) {
    const u = urgency.toLowerCase();
    return `<span class="badge badge-${u}">${urgency}</span>`;
}

function formatDate(dateStr) {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function addTimelineEvent(complaintId, status, note) {
    const complaint = getComplaintById(complaintId);
    if(complaint) {
        complaint.status = status;
        complaint.timeline.push({
            status: status,
            date: new Date().toISOString(),
            note: note
        });
        saveComplaint(complaint);
    }
}

function addChatMessage(complaintId, text) {
    const complaint = getComplaintById(complaintId);
    const user = getCurrentUser();
    if(complaint && user) {
        complaint.chat.push({
            sender: user.role,
            name: user.name,
            text: text,
            date: new Date().toISOString()
        });
        saveComplaint(complaint);
    }
}

// Run on load
initDB();
