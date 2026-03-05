import { API_BASE_URL } from '../config';
const API_URL = `${API_BASE_URL}/chat`;

export const chatApi = {
    getConversations: async () => {
        const token = localStorage.getItem('parent_token');
        const res = await fetch(`${API_URL}/conversations`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return res.json();
    },

    getMessages: async (conversationId: string) => {
        const token = localStorage.getItem('parent_token');
        const res = await fetch(`${API_URL}/messages/${conversationId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return res.json();
    },

    sendMessage: async (data: { conversationId?: string; text?: string; imageUrl?: string; targetRole?: string }) => {
        const token = localStorage.getItem('parent_token');
        const res = await fetch(`${API_URL}/send`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        return res.json();
    },

    uploadImage: async (file: File) => {
        const token = localStorage.getItem('parent_token');
        const formData = new FormData();
        formData.append('image', file);

        const res = await fetch(`${API_URL}/upload`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
        });
        return res.json();
    }
};
