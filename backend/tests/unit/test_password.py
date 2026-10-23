from backend.app.modules.auth.password import hash_password, verify_password

def test_hash_password_generates_different_hashes():
    pwd = "securepassword123"
    hash1 = hash_password(pwd)
    hash2 = hash_password(pwd)
    assert hash1 != hash2
    assert hash1.startswith("$argon2id$")

def test_verify_password_correct():
    pwd = "securepassword123"
    hashed = hash_password(pwd)
    assert verify_password(pwd, hashed) is True

def test_verify_password_incorrect():
    pwd = "securepassword123"
    hashed = hash_password(pwd)
    assert verify_password("wrongpassword", hashed) is False
