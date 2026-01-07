import { AI_API_URL } from "../config";
import { getToken } from "./auth";

const getHeaders = () => {
    const token = getToken();
    return {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
    };
};

export const checkHealth = async () => {
    const response = await fetch(`${AI_API_URL}/`);
    return response.json();
};

export const getProtectedData = async () => {
    const response = await fetch(`${AI_API_URL}/protected`, {
        headers: getHeaders(),
    });

    if (!response.ok) {
        if (response.status === 401) {
            throw new Error("Unauthorized");
        }
        throw new Error("Failed to fetch data");
    }

    return response.json();
};
