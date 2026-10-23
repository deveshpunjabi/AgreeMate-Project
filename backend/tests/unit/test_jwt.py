import uuid
import pytest
import jwt
from backend.app.modules.auth.tokens import create_access_token, create_refresh_token, verify_token
from backend.app.core.config import settings

@pytest.fixture
def mock_user_id():
    return uuid.uuid4()

def test_create_access_token(mock_user_id):
    token = create_access_token(mock_user_id)
    assert isinstance(token, str)
    
    payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM], audience=settings.JWT_AUDIENCE)
    assert payload["sub"] == str(mock_user_id)
    assert payload["type"] == "access"
    assert payload["iss"] == settings.JWT_ISSUER
    assert payload["aud"] == settings.JWT_AUDIENCE
    assert "exp" in payload

def test_create_refresh_token(mock_user_id):
    token = create_refresh_token(mock_user_id)
    assert isinstance(token, str)
    
    payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM], audience=settings.JWT_AUDIENCE)
    assert payload["sub"] == str(mock_user_id)
    assert payload["type"] == "refresh"
    assert payload["iss"] == settings.JWT_ISSUER
    assert payload["aud"] == settings.JWT_AUDIENCE
    assert "exp" in payload

def test_verify_token_valid(mock_user_id):
    token = create_access_token(mock_user_id)
    payload = verify_token(token)
    
    assert payload is not None
    assert payload["sub"] == str(mock_user_id)
    assert payload["type"] == "access"

def test_verify_token_invalid():
    invalid_token = "invalid.token.string"
    payload = verify_token(invalid_token)
    assert payload is None


@pytest.mark.parametrize("claim,value", [("iss", "other-service"), ("aud", "other-app")])
def test_verify_token_rejects_wrong_claims(mock_user_id, claim, value):
    token = create_access_token(mock_user_id)
    payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM], audience=settings.JWT_AUDIENCE)
    payload[claim] = value
    forged = jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)
    assert verify_token(forged) is None


def test_verify_token_rejects_wrong_signature(mock_user_id):
    token = create_access_token(mock_user_id)
    payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM], audience=settings.JWT_AUDIENCE)
    forged = jwt.encode(payload, "different-test-only-key-at-least-32-characters", algorithm=settings.JWT_ALGORITHM)
    assert verify_token(forged) is None

def test_verify_token_expired(monkeypatch, mock_user_id):
    # Temporarily set token expiration to the past
    monkeypatch.setattr(settings, "ACCESS_TOKEN_EXPIRE_MINUTES", -1)
    
    token = create_access_token(mock_user_id)
    payload = verify_token(token)
    
    # Expired tokens must be rejected.
    assert payload is None
