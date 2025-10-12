import axios from 'axios';

const API_URL = 'https://hureo-service-production.up.railway.app/api';

export const api = axios.create({ baseURL: API_URL });

export const setAuthToken = (token) => {
    if (token) api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    else delete api.defaults.headers.common['Authorization'];
};

const bootToken = localStorage.getItem('token');
if (bootToken) setAuthToken(bootToken);

export const registerCompany = (data) => api.post('/companies/register', data);
export const updateCompany = (id, data) => api.patch(`/companies/${id}`, data);
export const getCompany = (id) => api.get(`/companies/${id}`);
export const registerAdmin = (data) => api.post('/users/register/admin', data);
export const registerEmployee = (data) => api.post('/users/register/employee', data);
export const loginUser = (data) => api.post('/users/login', data);
export const getUsersByCompany = (companyId) => api.get(`/users/company/${companyId}`);
export const deleteUser = (id) => api.delete(`/users/${id}`);
export const getAllAttendance = () => api.get('/attendance');
export const getAllAttendanceByCompany = (companyId) => api.get(`/attendance/company/${companyId}`);
export const getAttendanceByUser = (userId) => api.get(`/attendance/${userId}`);
export const getAllLeaves = () => api.get('/leaves');
export const updateLeaveStatus = (id, status) => api.patch(`/leaves/${id}/status`, { status });
export const cancelLeave = (id) => api.delete(`/leaves/${id}`);
export const listJobs = (params = {}) => api.get('/jobs', { params });
export const createJob = (data) => api.post('/jobs', data);
export const getJob = (id) => api.get(`/jobs/${id}`);
export const updateJob = (id, data) => api.patch(`/jobs/${id}`, data);
export const closeJob = (id) => api.patch(`/jobs/${id}/close`);
export const deleteJob = (id) => api.delete(`/jobs/${id}`);
export const listCandidates = (params) => api.get('/candidates', { params });
export const updateCandidateStage = (id, stage) => api.patch(`/candidates/${id}/stage`, { stage });
export const deleteCandidate = (id) => api.delete(`/candidates/${id}`);
export const listEmployees = (params = {}) => api.get('/employees', { params });
export const getEmployeeById = (id, params = {}) => api.get(`/employees/${id}`, { params });
export const createEmployee = (data) => api.post('/employees', data);
export const updateEmployee = (id, data) => api.patch(`/employees/${id}`, data);
export const deleteEmployee = (id, params = {}) => api.delete(`/employees/${id}`, { params });
export const getCompanyKPI = (companyId, params = {}) => api.get(`/kpi/company/${companyId}`, { params });

// PUBLIC careers
export const publicListJobs = (companyCode) => api.get(`/public/${companyCode}/jobs`);
export const publicGetJob = (companyCode, slug) => api.get(`/public/${companyCode}/jobs/${slug}`);
export const publicListJobsByCompany = (companyCode) => api.get(`/public/${companyCode}/jobs`);
export const publicGetJobBySlug = (companyCode, slug) => api.get(`/public/${companyCode}/jobs/${slug}`);
export const publicApplyToJob = (companyCode, slug, formData) =>
    api.post(`/public/${companyCode}/jobs/${slug}/apply`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });

export async function logout(router) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    try {
        const { setAuthToken } = await import('../api/api');
        setAuthToken(null);
    } catch {}
    if (router) router.replace('/auth/login');
}

// ---- USERS ----
export const fetchUsersByCompany = async (companyId) => {
    const { data } = await api.get(`/users/company/${companyId}`);
    return Array.isArray(data) ? data : [];
};

// ---- ATTENDANCE ----
export const fetchAttendanceByCompany = async (companyId) => {
    const { data } = await api.get(`/attendance/company/${companyId}`);
    return Array.isArray(data) ? data : [];
};

export const fetchTodayAttendanceByCompany = async (companyId, tz = 'Asia/Jakarta') => {
    const { data } = await api.get(`/attendance/company/${companyId}/today`, {
        params: { tz }
    });
    return Array.isArray(data) ? data : [];
};

// ---- LEAVES ----
export const fetchAllLeaves = async () => {
    const { data } = await api.get(`/leaves`);
    return Array.isArray(data) ? data : [];
};
