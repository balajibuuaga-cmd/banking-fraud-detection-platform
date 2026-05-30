import axios from "axios";

const API_URL = "http://localhost:8080/api";

export const getSeverityStats = async () => {
    const response = await axios.get(
        `${API_URL}/analytics/severity`
    );

    return response.data;
};

export const getAllTransactions = async () => {
    const response = await axios.get(
        `${API_URL}/transactions`
    );

    return response.data;
};

export const getAllAlerts = async () => {
    const response = await axios.get(
        `${API_URL}/fraud-alerts`
    );

    return response.data;
};

export const updateAlertStatus = async (id, status) => {
    const response = await fetch(
        `http://localhost:8080/api/fraud-alerts/${id}/status?status=${status}`,
        {
            method: "PUT",
        }
    );

    return response.json();
};

export const getAlertById = async (id) => {
    const response = await fetch(
        `http://localhost:8080/api/fraud-alerts/${id}`
    );

    return response.json();
};
