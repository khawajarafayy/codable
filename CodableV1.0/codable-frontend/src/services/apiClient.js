const API_BASE = import.meta.env.VITE_API_URL?.replace(/\/$/, '') || 'http://localhost:3000';

async function request(path, { method = 'GET', body, credentials = 'omit', headers = {} } = {}) {
    // build full URL (allow absolute URLs too)
    const url = path.startsWith('http://') || path.startsWith('https://')
        ? path
        : `${API_BASE}${path.startsWith('/') ? '' : '/'}${path}`;

    const opts = {
        method,
        mode: 'cors',                // ensure CORS mode
        credentials,                 // 'omit' | 'same-origin' | 'include'
        headers: { ...headers },
    };

    if (body) {
        if (body instanceof FormData) {
            opts.body = body;
        } else {
            opts.headers['Content-Type'] = 'application/json';
            opts.body = JSON.stringify(body);
        }
    }

    console.log(`[API] ${method} ${url}`, { headers: opts.headers, body });

    try {
        const res = await fetch(url, opts);
        const text = await res.text();
        let data = null;
        try { data = text ? JSON.parse(text) : null; } catch { data = text; }

        console.log(`[API Response] Status: ${res.status}`, data);

        if (!res.ok) {
            const err = new Error(data?.message || res.statusText || 'Request failed');
            err.status = res.status;
            err.payload = data;
            throw err;
        }
        return data;
    } catch (error) {
        console.error(`[API Error] ${method} ${url}`, error);
        throw error;
    }
}

export const api = {
    // no credentials by default -> easier CORS in development
    login: (email, password, role) => request('/auth/login', { method: 'POST', body: { email, password, role }, credentials: 'omit' }),
    signup: (name, email, password, role) => request('/auth/signup', { method: 'POST', body: { name, email, password, role }, credentials: 'omit' }),
    me: () => request('/me'),
    runCode: (source_code, stdin) => request('/piston/run', { method: 'POST', body: { source_code, stdin }, credentials: 'omit' }),
    
    // Class APIs
    getClasses: (token) => {
        return request('/classes/instructor', { 
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` },
            credentials: 'omit'
        });
    },
    
    getClassStudents: (classId, token) => {
        return request(`/classes/${classId}/students`, { 
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` },
            credentials: 'omit'
        });
    },

    getStudentRecentActivity: () => {
        const token = localStorage.getItem('token');
        return request('/student-class/recent-activity', {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` },
            credentials: 'omit'
        });
    },

    // Student Profile APIs
    getStudentProfile: () => {
        const token = localStorage.getItem('token');
        // Add timestamp to prevent caching
        return request('/student/profile?t=' + Date.now(), { 
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` },
            credentials: 'omit'
        });
    },
    
    updateStudentProfile: (profileData) => {
        const token = localStorage.getItem('token');
        return request('/student/profile', {
            method: 'PUT',
            body: profileData,
            headers: { 'Authorization': `Bearer ${token}` },
            credentials: 'omit'
        });
    },

    uploadStudentProfilePicture: (avatarDataUrl) => {
        const token = localStorage.getItem('token');
        return request('/student/profile', {
            method: 'PUT',
            body: { avatar: avatarDataUrl },
            headers: { 'Authorization': `Bearer ${token}` },
            credentials: 'omit'
        });
    },

    // Admin APIs
    adminLogin: (email, password) => request('/api/admin/login', { method: 'POST', body: { email, password } }),
    getAdminMetrics: () => {
        const token = localStorage.getItem('token');
        return request('/api/admin/metrics', { method: 'GET', headers: { 'Authorization': `Bearer ${token}` } });
    },
    getAdminStudents: () => {
        const token = localStorage.getItem('token');
        return request('/api/admin/students', { method: 'GET', headers: { 'Authorization': `Bearer ${token}` } });
    },
    getAdminInstructors: () => {
        const token = localStorage.getItem('token');
        return request('/api/admin/instructors', { method: 'GET', headers: { 'Authorization': `Bearer ${token}` } });
    },
    
    createStudentProfile: (profileData) => {
        const token = localStorage.getItem('token');
        return request('/student/profile', {
            method: 'POST',
            body: profileData,
            headers: { 'Authorization': `Bearer ${token}` },
            credentials: 'omit'
        });
    },

    // Account Settings APIs
    getAccountSettings: () => {
        const token = localStorage.getItem('token');
        return request('/account-settings', {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` },
            credentials: 'omit'
        });
    },

    updateAccountSettings: (settingsData) => {
        const token = localStorage.getItem('token');
        return request('/account-settings', {
            method: 'PUT',
            body: settingsData,
            headers: { 'Authorization': `Bearer ${token}` },
            credentials: 'omit'
        });
    },

    upgradeMembership: (tier) => {
        const token = localStorage.getItem('token');
        return request('/student/membership/upgrade', {
            method: 'PUT',
            body: { tier },
            headers: { 'Authorization': `Bearer ${token}` },
            credentials: 'omit'
        });
    }
};

export { request };