import axios from "axios";

const API_URL = "http://localhost:8080/api";

const api = axios.create({
    baseURL: API_URL,
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
});

export const getSeverityStats = async () => {
    const response = await api.get("/analytics/severity");
    return response.data;
};

export const getAllTransactions = async () => {
    const response = await api.get("/transactions");
    return response.data;
};

export const getAllAlerts = async () => {
    const response = await api.get("/fraud-alerts");
    return response.data;
};

export const updateAlertStatus = async (id, status) => {
    const response = await api.put(`/fraud-alerts/${id}/status?status=${status}`);
    return response.data;
};

export const getAlertById = async (id) => {
    const response = await api.get(`/fraud-alerts/${id}`);
    return response.data;
};

export const getAllFraudCases = async () => {
    const response = await api.get("/fraud-cases");
    return response.data;
};

export const updateFraudCaseStatus = async (id, status) => {
    const response = await api.put(`/fraud-cases/${id}/status?status=${status}`);
    return response.data;
};

export const createFraudCase = async (alertId) => {
    const response = await api.post(`/fraud-cases/alert/${alertId}`, {
        assignedAnalyst: "Balaji",
        notes: "Fraud alert moved to investigation. Account and transaction details require analyst review."
    });

    return response.data;
};

export const updateAccountStatus = async (accountId, status) => {
    const response = await api.put(`/accounts/${accountId}/status?status=${status}`);
    return response.data;
};

export const getAccountById = async (accountId) => {
    const response = await api.get(`/accounts/${accountId}`);
    return response.data;
};

export const getAuditLogs = async () => {
    const response = await api.get("/audit-logs");
    return response.data;
};

export const createAuditLog = async (action, entityName, entityId) => {
    const response = await api.post("/audit-logs", {
        action,
        entityName,
        entityId,
        performedBy: localStorage.getItem("fullName") || "System"
    });

    return response.data;
};

export const assignFraudCaseAnalyst = async (caseId, analyst) => {
    const response = await api.put(
        `/fraud-cases/${caseId}/assign?analyst=${encodeURIComponent(analyst)}`
    );

    return response.data;
};

export const updateCaseNotes = async (caseId, notes) => {
    const response = await api.put(`/fraud-cases/${caseId}/notes`, { notes });

    return response.data;
};

export const getFraudRules = async () => {
    const response = await api.get("/fraud-rules");
    return response.data;
};

export const createFraudRule = async (rule) => {
    const response = await api.post("/fraud-rules", rule);
    return response.data;
};

export const updateRuleStatus = async (id, active) => {
    const response = await api.put(
        `/fraud-rules/${id}/status?active=${active}`
    );

    return response.data;
};

export const deleteRule = async (id) => {
    await api.delete(`/fraud-rules/${id}`);
};

export const getInvestigationSummary = async (caseId) => {
    const response = await api.get(
        `/investigation-assistant/case/${caseId}/summary`
    );

    return response.data;
};

export const getCustomer360 = async (customerId) => {
    const response = await api.get(`/customer-360/${customerId}`);
    return response.data;
};

export const askCopilot = async (message, context = {}) => {
    const response = await api.post("/copilot/chat", { message, context });
    return response.data;
};

export const getUsers = async () => {
    const response = await api.get("/users");
    return response.data;
};

export const updateUserRole = async (id, role) => {
    const response = await api.put(`/users/${id}/role?role=${encodeURIComponent(role)}`);
    return response.data;
};

export const updateUserActive = async (id, active) => {
    const response = await api.put(`/users/${id}/active?active=${active}`);
    return response.data;
};

export const importPaySimDataset = async (file) => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await api.post("/import/paysim", formData, {
        headers: {
            "Content-Type": "multipart/form-data",
        },
    });

    return response.data;
};
