function authHeaders(token) {
  return { Authorization: `Bearer ${token}` };
}

export async function getEvents(token) {
  const response = await fetch("/api/calendar/events", {
    headers: authHeaders(token),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || "Nie udało się pobrać wydarzeń");
  }
  return response.json(); // CalendarEventRead[]
}

export async function createEvent(token, data) {
  const response = await fetch("/api/calendar/events", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders(token) },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || "Nie udało się dodać wydarzenia");
  }
  return response.json();
}

export async function updateEvent(token, id, data) {
  const response = await fetch(`/api/calendar/events/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...authHeaders(token) },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || "Nie udało się zaktualizować wydarzenia");
  }
  return response.json();
}

export async function deleteEvent(token, id) {
  const response = await fetch(`/api/calendar/events/${id}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || "Nie udało się usunąć wydarzenia");
  }
  return response.json();
}
