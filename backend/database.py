import os
import sqlite3
import json
import hashlib
from datetime import datetime, timedelta
from config import DATABASE_PATH, STORAGE_DIR
from crypto_engine import CryptoEngine
from risk_engine import RiskEngine

def get_db_connection():
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    os.makedirs(STORAGE_DIR, exist_ok=True)
    conn = get_db_connection()
    cursor = conn.cursor()

    # Create users table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        role TEXT DEFAULT 'Security Analyst',
        password_hash TEXT NOT NULL,
        otp_secret TEXT DEFAULT '749215',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    # Create files table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS files (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        filename TEXT NOT NULL,
        original_name TEXT NOT NULL,
        file_type TEXT NOT NULL,
        file_size INTEGER NOT NULL,
        storage_path TEXT NOT NULL,
        risk_score INTEGER NOT NULL,
        risk_level TEXT NOT NULL,
        encryption_algo TEXT NOT NULL,
        key_size_bits INTEGER NOT NULL,
        nonce_hex TEXT NOT NULL,
        auth_tag_hex TEXT NOT NULL,
        salt_hex TEXT NOT NULL,
        plaintext_hash TEXT NOT NULL,
        encrypted_hash TEXT NOT NULL,
        status TEXT NOT NULL,
        requires_otp BOOLEAN DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
    );
    """)

    # Create security_events table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS security_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        event_type TEXT NOT NULL,
        risk_score INTEGER NOT NULL,
        severity TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        ip_address TEXT DEFAULT '192.168.1.104',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    # Create session_state table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS session_state (
        user_id INTEGER PRIMARY KEY,
        risk_score INTEGER DEFAULT 20,
        risk_level TEXT DEFAULT 'LOW',
        active_factors TEXT DEFAULT '{}',
        otp_verified BOOLEAN DEFAULT 0,
        last_ip TEXT DEFAULT '192.168.1.104',
        device_name TEXT DEFAULT 'CyberSec Workstation (Chrome 122)',
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
    );
    """)

    conn.commit()

    # Check if demo data needs to be seeded
    cursor.execute("SELECT COUNT(*) as count FROM users")
    if cursor.fetchone()["count"] == 0:
        seed_demo_data(conn)
    else:
        conn.close()

def seed_demo_data(conn):
    cursor = conn.cursor()

    # 1. Create Default Users
    # Password for demo: "cloudcrypt123"
    demo_pw_hash = hashlib.sha256(b"cloudcrypt123").hexdigest()
    cursor.execute("""
    INSERT INTO users (id, email, name, role, password_hash, otp_secret)
    VALUES (1, 'secops@cloudcrypt.io', 'Alex Mercer', 'Lead Security Architect', ?, '749215')
    """, (demo_pw_hash,))

    # 2. Setup Session State (Low Risk initial)
    initial_factors = {"new_device": False, "unknown_ip": False, "unusual_time": False, "failed_logins": False, "suspicious_download": False, "unusual_location": False}
    cursor.execute("""
    INSERT INTO session_state (user_id, risk_score, risk_level, active_factors, otp_verified, last_ip, device_name)
    VALUES (1, 20, 'LOW', ?, 0, '192.168.1.104', 'Corporate Secure Node (Ubuntu/X11)')
    """, (json.dumps(initial_factors),))

    # 3. Seed Realistic Demo Files with Real AES Encryption
    demo_files = [
        {
            "name": "research_paper.pdf",
            "type": "PDF",
            "content": b"%PDF-1.5 %Adaptive Cryptography Research Paper: Risk-Aware Cloud Storage with Dynamic Symmetric Ciphers. Abstract: This paper presents CloudCrypt...",
            "score": 15,
            "level": "LOW",
            "bits": 128,
            "status": "Protected",
            "requires_otp": 0,
            "time_offset_min": -180
        },
        {
            "name": "semester_project.docx",
            "type": "DOCX",
            "content": b"PK\x03\x04[Content_Types].xml CloudCrypt B.Tech PBL Project Specification: System Architecture, Threat Modeling, and Dynamic AES Cipher Allocation.",
            "score": 22,
            "level": "LOW",
            "bits": 128,
            "status": "Protected",
            "requires_otp": 0,
            "time_offset_min": -120
        },
        {
            "name": "cloud_architecture.png",
            "type": "PNG",
            "content": b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR CloudCrypt High-Level Microservice & KMS Architecture Blueprint [Symmetric GCM Pipeline]",
            "score": 48,
            "level": "MEDIUM",
            "bits": 192,
            "status": "Enhanced Protection",
            "requires_otp": 0,
            "time_offset_min": -75
        },
        {
            "name": "credentials_backup.txt",
            "type": "TXT",
            "content": b"CONFIDENTIAL CREDENTIAL ARCHIVE [TOP SECRET]\nAWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE\nDATABASE_URL=postgres://master:p@ssw0rd@prod-db.internal:5432/cloudcrypt",
            "score": 82,
            "level": "HIGH",
            "bits": 256,
            "status": "Restricted (OTP Required)",
            "requires_otp": 1,
            "time_offset_min": -30
        },
        {
            "name": "database_backup.zip",
            "type": "ZIP",
            "content": b"PK\x03\x04SQLite Master Database Snapshot - Automated Hourly Dump: Schemas, Encryption Vectors, Audit Logs, and User Profiles.",
            "score": 88,
            "level": "HIGH",
            "bits": 256,
            "status": "Restricted (OTP Required)",
            "requires_otp": 1,
            "time_offset_min": -10
        }
    ]

    now = datetime.now()

    for item in demo_files:
        enc_res = CryptoEngine.encrypt_data(item["content"], key_bits=item["bits"])
        safe_name = f"{int(now.timestamp())}_{item['name']}"
        file_path = os.path.join(STORAGE_DIR, safe_name)
        with open(file_path, "wb") as f:
            f.write(enc_res["encrypted_payload"])

        file_time = (now + timedelta(minutes=item["time_offset_min"])).strftime("%Y-%m-%d %H:%M:%S")

        cursor.execute("""
        INSERT INTO files (
            user_id, filename, original_name, file_type, file_size, storage_path,
            risk_score, risk_level, encryption_algo, key_size_bits,
            nonce_hex, auth_tag_hex, salt_hex, plaintext_hash, encrypted_hash,
            status, requires_otp, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            1, safe_name, item["name"], item["type"], len(item["content"]), file_path,
            item["score"], item["level"], enc_res["algorithm"], enc_res["key_bits"],
            enc_res["nonce_hex"], enc_res["auth_tag_hex"], enc_res["salt_hex"],
            enc_res["plaintext_hash"], enc_res["encrypted_hash"],
            item["status"], item["requires_otp"], file_time
        ))

    # 4. Seed Realistic Security Activity Timeline
    demo_events = [
        {
            "type": "AUTH_LOGIN",
            "score": 15,
            "severity": "INFO",
            "title": "Secure Session Established",
            "desc": "Operator Alex Mercer authenticated via corporate internal gateway. Baseline risk computed.",
            "ip": "192.168.1.104",
            "min_offset": -240
        },
        {
            "type": "RISK_EVAL",
            "score": 15,
            "severity": "INFO",
            "title": "Risk Score Baseline Calculated: 15 / 100",
            "desc": "Device fingerprint recognized (Corporate Secure Node). Anomaly score below threshold.",
            "ip": "192.168.1.104",
            "min_offset": -238
        },
        {
            "type": "FILE_ENCRYPT",
            "score": 15,
            "severity": "INFO",
            "title": "AES-128 Protection Applied",
            "desc": "Uploaded 'research_paper.pdf' encapsulated with AES-128-GCM authenticated cipher.",
            "ip": "192.168.1.104",
            "min_offset": -180
        },
        {
            "type": "FILE_ENCRYPT",
            "score": 22,
            "severity": "INFO",
            "title": "AES-128 Protection Applied",
            "desc": "Uploaded 'semester_project.docx' sealed with PBKDF2 derived 128-bit symmetric key.",
            "ip": "192.168.1.104",
            "min_offset": -120
        },
        {
            "type": "RISK_EVAL",
            "score": 48,
            "severity": "MEDIUM",
            "title": "Risk Score Increased to 48 (MEDIUM)",
            "desc": "Off-hours access anomaly detected. Adaptive security stepping up to Tier 2.",
            "ip": "192.168.1.104",
            "min_offset": -80
        },
        {
            "type": "POLICY_ENFORCE",
            "score": 48,
            "severity": "MEDIUM",
            "title": "AES-192 Security Tier Engaged",
            "desc": "Cryptographic engine reconfigured to 192-bit Galois/Counter Mode with enhanced telemetry.",
            "ip": "192.168.1.104",
            "min_offset": -78
        },
        {
            "type": "FILE_ENCRYPT",
            "score": 48,
            "severity": "MEDIUM",
            "title": "AES-192 Enhanced Protection Applied",
            "desc": "Uploaded 'cloud_architecture.png' sealed with 192-bit high-assurance key.",
            "ip": "192.168.1.104",
            "min_offset": -75
        },
        {
            "type": "THREAT_DETECTED",
            "score": 82,
            "severity": "HIGH",
            "title": "Suspicious Login Vectors Identified",
            "desc": "Multiple rapid IP variations and unverified client fingerprint flagged. Risk elevated to 82.",
            "ip": "198.51.100.77",
            "min_offset": -35
        },
        {
            "type": "POLICY_ENFORCE",
            "score": 82,
            "severity": "HIGH",
            "title": "AES-256 Maximum Security Enabled",
            "desc": "Adaptive policy escalated to military-grade AES-256. OTP two-factor verification required for data export.",
            "ip": "198.51.100.77",
            "min_offset": -32
        },
        {
            "type": "FILE_ENCRYPT",
            "score": 82,
            "severity": "HIGH",
            "title": "AES-256 Restricted Protection Applied",
            "desc": "Encrypted 'credentials_backup.txt' with 256-bit GCM cipher. Download lock armed.",
            "ip": "198.51.100.77",
            "min_offset": -30
        },
        {
            "type": "FILE_ENCRYPT",
            "score": 88,
            "severity": "HIGH",
            "title": "AES-256 Restricted Protection Applied",
            "desc": "Encrypted 'database_backup.zip' with 256-bit GCM cipher. Download lock armed.",
            "ip": "198.51.100.77",
            "min_offset": -10
        }
    ]

    for ev in demo_events:
        ev_time = (now + timedelta(minutes=ev["min_offset"])).strftime("%Y-%m-%d %H:%M:%S")
        cursor.execute("""
        INSERT INTO security_events (user_id, event_type, risk_score, severity, title, description, ip_address, created_at)
        VALUES (1, ?, ?, ?, ?, ?, ?, ?)
        """, (ev["type"], ev["score"], ev["severity"], ev["title"], ev["desc"], ev["ip"], ev_time))

    conn.commit()
    conn.close()
