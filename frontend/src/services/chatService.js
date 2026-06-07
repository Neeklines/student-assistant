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

function parseSseEvent(rawEvent) {
  let event = "message";
  const dataLines = [];

  for (const line of rawEvent.split("\n")) {
    if (line.startsWith("event:")) {
      event = line.slice("event:".length).trim();
    }
    if (line.startsWith("data:")) {
      dataLines.push(line.slice("data:".length).trimStart());
    }
  }

  const dataText = dataLines.join("\n");
  const data = dataText ? JSON.parse(dataText) : {};
  return { event, data };
}

export async function sendMessageStream(
  token,
  sessionId,
  message,
  imageFile,
  { onChunk } = {},
) {
  const formData = new FormData();
  formData.append("session_id", sessionId);
  formData.append("message", message);
  if (imageFile) {
    formData.append("image", imageFile);
  }

  const response = await fetch("/api/chat/stream", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || "Czat nie odpowiada");
  }
  if (!response.body) {
    throw new Error("Czat nie zwrócił strumienia odpowiedzi");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let fullText = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const events = buffer.split("\n\n");
    buffer = events.pop() ?? "";

    for (const rawEvent of events) {
      if (!rawEvent.trim()) continue;
      const { event, data } = parseSseEvent(rawEvent);

      if (event === "chunk") {
        const text = data.text ?? "";
        fullText += text;
        onChunk?.(text);
      }
      if (event === "error") {
        throw new Error(data.detail || "Czat nie odpowiada");
      }
      if (event === "done") {
        return { response: fullText };
      }
    }
  }

  if (buffer.trim()) {
    const { event, data } = parseSseEvent(buffer);
    if (event === "chunk") {
      const text = data.text ?? "";
      fullText += text;
      onChunk?.(text);
    }
    if (event === "error") {
      throw new Error(data.detail || "Czat nie odpowiada");
    }
  }

  return { response: fullText };
}
