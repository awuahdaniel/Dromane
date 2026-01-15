import { AI_API_URL, AUTH_API_URL } from "./config";
import { getToken } from "./auth";

const getHeaders = () => {
    const token = getToken();
    return {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
    };
};

const handleResponse = async (response, defaultMessage) => {
    if (!response.ok) {
        let errorMessage = defaultMessage;
        try {
            const error = await response.json();
            errorMessage = error.detail || errorMessage;
        } catch (e) {
            const text = await response.text();
            console.error(`API Error (${defaultMessage}):`, text);
            errorMessage = `Server Error (${response.status})`;
        }
        throw new Error(errorMessage);
    }
    return response.json();
};

export const summarizeDocument = async () => {
    const response = await fetch(`${AI_API_URL}/summarize`, {
        method: 'POST',
        headers: getHeaders(),
    });
    return handleResponse(response, 'Summarization failed');
};

export const explainCode = async (code) => {
    const response = await fetch(`${AI_API_URL}/explain-code`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ question: code }),
    });
    return handleResponse(response, 'Code explanation failed');
};

export const humanizeText = async (text) => {
    const response = await fetch(`${AI_API_URL}/humanize`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ question: text }),
    });
    return handleResponse(response, 'Humanizing text failed');
};

export const summarizeText = async (text) => {
    const response = await fetch(`${AI_API_URL}/summarize`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ text: text }),
    });
    return handleResponse(response, 'Summarization failed');
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
    return handleResponse(response, 'Upload failed');
};

export const sendChatMessage = async (question) => {
    const response = await fetch(`${AI_API_URL}/chat`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ question })
    });
    return handleResponse(response, 'Chat failed');
};

export const performResearch = async (query) => {
    const response = await fetch(`${AI_API_URL}/api/research`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ query })
    });
    return handleResponse(response, 'Research failed');
};

export const clearDocuments = async () => {
    const response = await fetch(`${AI_API_URL}/clear`, {
        method: "DELETE",
        headers: getHeaders()
    });
    return handleResponse(response, 'Failed to clear history');
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
