from unittest.mock import patch

from app.models.user import User


def test_register(client):
    response = client.post(
        "/api/auth/register",
        json={"email": "test@test.com", "password": "123"},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "test@test.com"


def test_login(client):
    # create user first
    client.post(
        "/api/auth/register",
        json={"email": "test@test.com", "password": "123"},
    )

    response = client.post(
        "/api/auth/login",
        json={"email": "test@test.com", "password": "123"},
    )

    assert response.status_code == 200

    data = response.json()

    assert "access_token" in data
    assert data["token_type"] == "bearer"


def test_google_login_creates_user_with_hashed_password(client, db, monkeypatch):
    monkeypatch.setenv("GOOGLE_CLIENT_ID", "client-id.apps.googleusercontent.com")

    with patch("app.routers.auth.id_token.verify_oauth2_token") as verify_token:
        verify_token.return_value = {"email": "google@test.com"}

        response = client.post(
            "/api/auth/google-login",
            json={"credential": "google-id-token"},
        )

    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"

    user = db.query(User).filter(User.email == "google@test.com").first()
    assert user is not None
    assert user.password.startswith("$argon2")
