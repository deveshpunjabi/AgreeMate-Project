import hashlib
import hmac
import secrets
import struct
import time
from typing import List, Tuple

# Base32 alphabet according to RFC 4648
BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'

def generate_totp_secret(length: int = 20) -> str:
    """Generate a random Base32 TOTP secret key."""
    random_bytes = secrets.token_bytes(length)
    # Convert bytes to base32
    return base32_encode(random_bytes)

def base32_encode(data: bytes) -> str:
    """Encode bytes to base32 string without padding."""
    result = []
    buffer = 0
    bits_in_buffer = 0
    for byte in data:
        buffer = (buffer << 8) | byte
        bits_in_buffer += 8
        while bits_in_buffer >= 5:
            bits_in_buffer -= 5
            index = (buffer >> bits_in_buffer) & 0x1F
            result.append(BASE32_ALPHABET[index])
    if bits_in_buffer > 0:
        index = (buffer << (5 - bits_in_buffer)) & 0x1F
        result.append(BASE32_ALPHABET[index])
    return ''.join(result)

def base32_decode(s: str) -> bytes:
    """Decode base32 string to bytes."""
    s = s.upper().rstrip('=')
    buffer = 0
    bits_in_buffer = 0
    result = bytearray()
    for char in s:
        if char not in BASE32_ALPHABET:
            continue
        val = BASE32_ALPHABET.index(char)
        buffer = (buffer << 5) | val
        bits_in_buffer += 5
        if bits_in_buffer >= 8:
            bits_in_buffer -= 8
            result.append((buffer >> bits_in_buffer) & 0xFF)
    return bytes(result)

def generate_totp_code(secret: str, time_step: int = 30, for_time: float = None) -> str:
    """Generate a 6-digit TOTP code for a given secret at current time (RFC 6238)."""
    if for_time is None:
        for_time = time.time()
    counter = int(for_time // time_step)
    counter_bytes = struct.pack('>Q', counter)
    secret_bytes = base32_decode(secret)
    hmac_hash = hmac.new(secret_bytes, counter_bytes, hashlib.sha1).digest()
    offset = hmac_hash[-1] & 0x0F
    binary = struct.unpack('>I', hmac_hash[offset:offset + 4])[0] & 0x7FFFFFFF
    code = binary % 1000000
    return f"{code:06d}"

def verify_totp_code(secret: str, code: str, window: int = 1) -> bool:
    """Verify TOTP code with time drift window tolerance (±window 30-sec intervals)."""
    now = time.time()
    code = code.strip()
    for step in range(-window, window + 1):
        test_time = now + (step * 30)
        expected_code = generate_totp_code(secret, for_time=test_time)
        if hmac.compare_digest(expected_code, code):
            return True
    return False

def get_totp_uri(secret: str, user_email: str, issuer: str = "AgreeMate") -> str:
    """Generate Key URI for QR code generation (otpauth://totp/...)."""
    encoded_issuer = issuer.replace(' ', '%20')
    encoded_email = user_email.replace(' ', '%20')
    return f"otpauth://totp/{encoded_issuer}:{encoded_email}?secret={secret}&issuer={encoded_issuer}&algorithm=SHA1&digits=6&period=30"

def generate_backup_codes(count: int = 10) -> Tuple[List[str], List[str]]:
    """Generate count random backup codes and their SHA-256 hashes."""
    plain_codes = []
    hashed_codes = []
    for _ in range(count):
        # Format: xxxx-xxxx (8 hex chars)
        part1 = secrets.token_hex(2).upper()
        part2 = secrets.token_hex(2).upper()
        code = f"{part1}-{part2}"
        code_hash = hashlib.sha256(code.encode('utf-8')).hexdigest()
        plain_codes.append(code)
        hashed_codes.append(code_hash)
    return plain_codes, hashed_codes
