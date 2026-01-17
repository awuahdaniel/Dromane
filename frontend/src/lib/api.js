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
    let responseText = "";
    try {
        responseText = await response.text();
    } catch (e) {
        // Fallback if text() fails
    }

    if (!response.ok) {
        let errorMessage = defaultMessage;
        if (responseText) {
            try {
                const errorJson = JSON.parse(responseText);
                errorMessage = errorJson.detail || errorJson.message || errorJson.error || errorMessage;
            } catch (e) {
                errorMessage = responseText || `Server Error (${response.status})`;
            }
        } else {
            errorMessage = `Server Error (${response.status})`;
        }
        throw new Error(errorMessage);
    }

    if (!responseText || responseText.trim() === "") {
        return {};
    }

    try {
        return JSON.parse(responseText);
    } catch (e) {
        console.error(`Failed to parse JSON response (${defaultMessage}):`, responseText);
        return { raw: responseText };
    }
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
    return handleResponse(response, 'Failed to fetch documents');
};

export const checkHealth = async () => {
    const response = await fetch(`${AI_API_URL}/`);
    return handleResponse(response, 'Health check failed');
};

export const getProtectedData = async () => {
    const response = await fetch(`${AI_API_URL}/protected`, {
        headers: getHeaders(),
    });
    return handleResponse(response, 'Failed to fetch protected data');
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

export const performResearch = async (query, session_id = null) => {
    const response = await fetch(`${AI_API_URL}/api/research`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ query, session_id })
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

    const data = await handleResponse(response, 'Failed to update profile');

    // Update local storage if successful
    if (data.token) localStorage.setItem('token', data.token);
    if (data.user) localStorage.setItem('user', JSON.stringify(data.user));

    return data;
};

export const uploadProfilePicture = async (file) => {
    const formData = new FormData();
    formData.append("picture", file);

    const token = getToken();
    const response = await fetch(`${AUTH_API_URL}/profile/upload-picture`, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${token}`
        },
        body: formData
    });

    const data = await handleResponse(response, 'Failed to upload profile picture');

    // Update local storage if successful
    if (data.user) {
        localStorage.setItem('user', JSON.stringify(data.user));
    }

    return data;
};

export const changePassword = async (currentPassword, newPassword) => {
    const response = await fetch(`${AUTH_API_URL}/profile/password`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ currentPassword, newPassword })
    });

    return handleResponse(response, 'Failed to change password');
};

// Alias for uploadDocument
export const uploadPDF = uploadDocument;
