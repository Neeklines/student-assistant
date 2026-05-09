const API_URL = 'http://localhost:8000/api/chat/';

export const sendMessageToAgent = async (sessionId, message) => {
    const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ session_id: sessionId, message }),
    });

    if (!response.ok) {
        throw new Error('Network response was not ok');
    }

    return response.json();
};