const API_URL = 'http://localhost:8000/api/chat/';

export const sendMessageToAgent = async (sessionId, message, imageFile = null) => {
    const formData = new FormData();
    formData.append('session_id', sessionId);
    formData.append('message', message);
    if (imageFile) {
        formData.append('image', imageFile);
    }

    const response = await fetch(API_URL, {
        method: 'POST',
        body: formData,
    });

    if (!response.ok) {
        throw new Error('Network response was not ok');
    }

    return response.json();
};