import { AI_API_URL, AUTH_API_URL } from "./config";
import { getToken } from "./auth";

const getHeaders = () => {
    const token = getToken();
    return {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
    };
};

export const summarizeDocument = async () => {
    const response = await fetch(`${AI_API_URL}/summarize`, {
        method: 'POST',
        headers: getHeaders(),
    });
    if (!response.ok) throw new Error('Summarization failed');
    return response.json();
};

export const explainCode = async (code) => {
    const response = await fetch(`${AI_API_URL}/explain-code`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ question: code }),
    });
    if (!response.ok) throw new Error('Code explanation failed');
    return response.json();
};

export const humanizeText = async (text) => {
    const response = await fetch(`${AI_API_URL}/humanize`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ question: text }),
    });
    if (!response.ok) throw new Error('Humanizing text failed');
    return response.json();
};

export const getDocuments = async () => {
    const response = await fetch(`${AUTH_API_URL}/documents.php`, {
        method: 'GET',
        headers: getHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch documents');
    return response.json();
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

export const uploadDocument = async (file) => {
    const formData = new FormData();
    formData.append("file", file);

    const token = getToken();
    const response = await fetch(`${AI_API_URL}/upload`, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${token}`
        },
        body: formData
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Upload failed");
    }

    return response.json();
};

export const sendChatMessage = async (question) => {
    const response = await fetch(`${AI_API_URL}/chat`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ question })
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Chat failed");
    }

    return response.json();
};

export const performResearch = async (query) => {
    const response = await fetch(`${AI_API_URL}/api/research`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ query })
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Research failed");
    }

    return response.json();
};

export const clearDocuments = async () => {
    const response = await fetch(`${AI_API_URL}/clear`, {
        method: "DELETE",
        headers: getHeaders()
    });

    if (!response.ok) {
        throw new Error("Failed to clear history");
    }

    return await response.json();
};

export const updateProfile = async (name, email) => {
    const response = await fetch(`${AUTH_API_URL}/profile/update`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ name, email })
    });

    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.error || 'Failed to update profile');
    }

    // Update local storage if successful
    if (data.token) localStorage.setItem('token', data.token);
    if (data.user) localStorage.setItem('user', JSON.stringify(data.user));

    return data;
};

export const changePassword = async (currentPassword, newPassword) => {
    const response = await fetch(`${AUTH_API_URL}/profile/password`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ currentPassword, newPassword })
    });

    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.error || 'Failed to change password');
    }
    return data;
};

// Alias for uploadDocument
export const uploadPDF = uploadDocument;
