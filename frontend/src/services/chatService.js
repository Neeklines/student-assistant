const SESSION_KEY = "chat_session_id";

export function getOrCreateSessionId() {
  let sessionId = sessionStorage.getItem(SESSION_KEY);
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    sessionStorage.setItem(SESSION_KEY, sessionId);
  }
  return sessionId;
}

export function resetSessionId() {
  sessionStorage.removeItem(SESSION_KEY);
}

export async function sendMessage(token, sessionId, message, imageFile) {
  const formData = new FormData();
  formData.append("session_id", sessionId);
  formData.append("message", message);
  if (imageFile) {
    formData.append("image", imageFile);
  }

  const response = await fetch("/api/chat/", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || "Czat nie odpowiada");
  }
  return response.json(); // { response: string }
}
