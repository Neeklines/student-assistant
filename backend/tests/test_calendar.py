from datetime import datetime, timedelta, timezone

from app.models.calendar_event import CalendarEvent


def _register_and_login(client, email="cal@test.com", password="secret"):
    client.post("/api/auth/register", json={"email": email, "password": password})
    res = client.post("/api/auth/login", json={"email": email, "password": password})
    return res.json()["access_token"]


def _make_event_payload(title="Math lecture", offset_hours=1):
    start = datetime.now(timezone.utc) + timedelta(hours=offset_hours)
    end = start + timedelta(hours=1)
    return {
        "title": title,
        "start_time": start.isoformat(),
        "end_time": end.isoformat(),
        "event_type": "lecture",
        "priority": "high",
        "status": "planned",
        "created_by": "manual",
    }


def test_calendar_requires_auth(client):
    assert client.get("/api/calendar/events").status_code in (401, 403)
    assert client.post(
        "/api/calendar/events", json=_make_event_payload()
    ).status_code in (401, 403)


def test_calendar_create_and_list(client, db):
    token = _register_and_login(client)
    headers = {"Authorization": f"Bearer {token}"}

    create_res = client.post(
        "/api/calendar/events",
        json=_make_event_payload(title="Algebra"),
        headers=headers,
    )
    assert create_res.status_code == 200
    created = create_res.json()
    assert created["title"] == "Algebra"
    assert created["id"]
    assert created["user_id"]

    list_res = client.get("/api/calendar/events", headers=headers)
    assert list_res.status_code == 200
    events = list_res.json()
    assert len(events) == 1
    assert events[0]["title"] == "Algebra"


def test_calendar_update(client):
    token = _register_and_login(client)
    headers = {"Authorization": f"Bearer {token}"}

    created = client.post(
        "/api/calendar/events",
        json=_make_event_payload(title="Old title"),
        headers=headers,
    ).json()

    updated_payload = _make_event_payload(title="New title")
    res = client.put(
        f"/api/calendar/events/{created['id']}", json=updated_payload, headers=headers
    )
    assert res.status_code == 200
    assert res.json()["title"] == "New title"


def test_calendar_delete(client, db):
    token = _register_and_login(client)
    headers = {"Authorization": f"Bearer {token}"}

    created = client.post(
        "/api/calendar/events", json=_make_event_payload(), headers=headers
    ).json()

    res = client.delete(f"/api/calendar/events/{created['id']}", headers=headers)
    assert res.status_code == 200

    assert db.query(CalendarEvent).count() == 0


def test_calendar_isolation_between_users(client):
    token_a = _register_and_login(client, email="alice@test.com")
    token_b = _register_and_login(client, email="bob@test.com")

    # Alice creates an event
    a_event = client.post(
        "/api/calendar/events",
        json=_make_event_payload(title="Alice's lecture"),
        headers={"Authorization": f"Bearer {token_a}"},
    ).json()

    # Bob lists — empty
    b_list = client.get(
        "/api/calendar/events",
        headers={"Authorization": f"Bearer {token_b}"},
    )
    assert b_list.status_code == 200
    assert b_list.json() == []

    # Bob cannot update Alice's event
    res = client.put(
        f"/api/calendar/events/{a_event['id']}",
        json=_make_event_payload(title="Hijacked"),
        headers={"Authorization": f"Bearer {token_b}"},
    )
    assert res.status_code == 404

    # Bob cannot delete Alice's event
    res = client.delete(
        f"/api/calendar/events/{a_event['id']}",
        headers={"Authorization": f"Bearer {token_b}"},
    )
    assert res.status_code == 404
