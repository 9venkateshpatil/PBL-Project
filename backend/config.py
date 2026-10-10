import os

BASE_DIR = os.path.abspath(os.path.dirname(__file__))
PROJECT_DIR = os.path.abspath(os.path.join(BASE_DIR, ".."))

DATABASE_PATH = os.path.join(BASE_DIR, "cloudcrypt.db")
STORAGE_DIR = os.path.join(BASE_DIR, "storage")
FRONTEND_DIST_DIR = os.path.join(PROJECT_DIR, "frontend", "dist")

SECRET_KEY = os.environ.get("SECRET_KEY", "cloudcrypt-cybersecurity-secret-key-2026")
DEFAULT_MASTER_KEY = b"CloudCrypt-Enterprise-Adaptive-Encryption-Key-32Bytes!"

# Risk Evaluation Thresholds
RISK_THRESHOLDS = {
    "LOW_MAX": 30,
    "MEDIUM_MAX": 70,
    "HIGH_MAX": 100,
}

# Adaptive Security Policies
SECURITY_POLICIES = {
    "LOW": {
        "level": "LOW",
        "encryption": "AES-128",
        "key_bits": 128,
        "mode": "GCM",
        "status_label": "Protected",
        "session_status": "Trusted",
        "mfa_required": False,
        "description": "Standard high-performance encryption for trusted sessions."
    },
    "MEDIUM": {
        "level": "MEDIUM",
        "encryption": "AES-192",
        "key_bits": 192,
        "mode": "GCM",
        "status_label": "Enhanced Protection",
        "session_status": "Monitored",
        "mfa_required": False,
        "description": "Elevated cryptographic strength with heightened audit logging."
    },
    "HIGH": {
        "level": "HIGH",
        "encryption": "AES-256",
        "key_bits": 256,
        "mode": "GCM",
        "status_label": "Restricted (OTP Required)",
        "session_status": "Restricted",
        "mfa_required": True,
        "description": "Maximum military-grade encryption with mandatory two-factor OTP verification."
    }
}
