import os
import hashlib
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.backends import default_backend
from config import DEFAULT_MASTER_KEY

class CryptoEngine:
    """
    Risk-Adaptive Cryptographic Engine supporting AES-128, AES-192, and AES-256.
    Uses AES in Galois/Counter Mode (GCM) for authenticated encryption.
    """

    @staticmethod
    def derive_key(master_key: bytes, salt: bytes, key_bits: int) -> bytes:
        """
        Derives an encryption key of exact bit length (128, 192, or 256)
        using PBKDF2 with SHA-256.
        """
        key_bytes = key_bits // 8
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=key_bytes,
            salt=salt,
            iterations=100_000,
            backend=default_backend()
        )
        return kdf.derive(master_key)

    @classmethod
    def encrypt_data(cls, plaintext: bytes, key_bits: int = 128, custom_key: bytes = None) -> dict:
        """
        Encrypts plaintext using AES-GCM with adaptive key length.
        
        Args:
            plaintext (bytes): The raw file data to encrypt.
            key_bits (int): 128, 192, or 256.
            custom_key (bytes): Optional custom passphrase / master key.
            
        Returns:
            dict containing:
                - encrypted_payload: bytes (ciphertext + auth tag)
                - salt_hex: str
                - nonce_hex: str
                - key_bits: int
                - algorithm: str
                - plaintext_hash: str (SHA-256)
                - encrypted_hash: str (SHA-256)
        """
        if key_bits not in (128, 192, 256):
            key_bits = 128

        master = custom_key if custom_key else DEFAULT_MASTER_KEY
        salt = os.urandom(16)
        nonce = os.urandom(12)  # Standard 96-bit nonce for AES-GCM

        derived_key = cls.derive_key(master, salt, key_bits)
        aesgcm = AESGCM(derived_key)

        # AESGCM.encrypt appends the 16-byte authentication tag to the ciphertext
        ciphertext_with_tag = aesgcm.encrypt(nonce, plaintext, None)

        plaintext_hash = hashlib.sha256(plaintext).hexdigest()
        encrypted_hash = hashlib.sha256(ciphertext_with_tag).hexdigest()

        # Split tag for inspection details (last 16 bytes)
        tag = ciphertext_with_tag[-16:] if len(ciphertext_with_tag) >= 16 else b""

        return {
            "encrypted_payload": ciphertext_with_tag,
            "salt_hex": salt.hex(),
            "nonce_hex": nonce.hex(),
            "auth_tag_hex": tag.hex(),
            "key_bits": key_bits,
            "algorithm": f"AES-{key_bits}-GCM",
            "plaintext_hash": plaintext_hash,
            "encrypted_hash": encrypted_hash,
            "plaintext_size": len(plaintext),
            "encrypted_size": len(ciphertext_with_tag)
        }

    @classmethod
    def decrypt_data(cls, ciphertext_with_tag: bytes, salt_hex: str, nonce_hex: str, key_bits: int, custom_key: bytes = None) -> bytes:
        """
        Decrypts an encrypted payload using AES-GCM.
        """
        master = custom_key if custom_key else DEFAULT_MASTER_KEY
        salt = bytes.fromhex(salt_hex)
        nonce = bytes.fromhex(nonce_hex)

        derived_key = cls.derive_key(master, salt, key_bits)
        aesgcm = AESGCM(derived_key)

        plaintext = aesgcm.decrypt(nonce, ciphertext_with_tag, None)
        return plaintext

    @classmethod
    def get_security_details(cls, key_bits: int) -> dict:
        """Returns cryptographic specs for UI visualization."""
        specs = {
            128: {
                "algorithm": "AES-128-GCM",
                "key_length": "128 bits (16 bytes)",
                "security_margin": "Standard Commercial Security",
                "quantum_resistance": "64 bits (Grover's algorithm)",
                "recommended_for": "Low risk, trusted internal networks",
                "overhead": "Negligible latency, hardware accelerated"
            },
            192: {
                "algorithm": "AES-192-GCM",
                "key_length": "192 bits (24 bytes)",
                "security_margin": "Enhanced Enterprise Security",
                "quantum_resistance": "96 bits",
                "recommended_for": "Medium risk, anomalous location or off-hour access",
                "overhead": "Sub-millisecond latency, robust protection"
            },
            256: {
                "algorithm": "AES-256-GCM",
                "key_length": "256 bits (32 bytes)",
                "security_margin": "Maximum Military & Top Secret Grade",
                "quantum_resistance": "128 bits (Post-quantum resistant symmetric)",
                "recommended_for": "High risk, suspicious vectors or untrusted sessions",
                "overhead": "Highest cryptanalytic defense, OTP gated"
            }
        }
        return specs.get(key_bits, specs[128])
