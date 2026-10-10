import os
import io
import json
from datetime import datetime
from flask import Blueprint, request, jsonify, send_file
from werkzeug.utils import secure_filename
from database import get_db_connection
from config import STORAGE_DIR, SECURITY_POLICIES
from crypto_engine import CryptoEngine
from risk_engine import RiskEngine

files_bp = Blueprint("files", __name__)

@files_bp.route("", methods=["GET"])
def list_files():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM files ORDER BY id DESC")
    files_rows = cursor.fetchall()

    cursor.execute("SELECT otp_verified FROM session_state WHERE user_id = 1")
    session = cursor.fetchone()
    otp_verified = bool(session["otp_verified"]) if session else False

    files_list = []
    for row in files_rows:
        files_list.append({
            "id": row["id"],
            "filename": row["filename"],
            "original_name": row["original_name"],
            "file_type": row["file_type"],
            "file_size": row["file_size"],
            "risk_score": row["risk_score"],
            "risk_level": row["risk_level"],
            "encryption_algo": row["encryption_algo"],
            "key_size_bits": row["key_size_bits"],
            "status": row["status"],
            "requires_otp": bool(row["requires_otp"]),
            "is_locked": bool(row["requires_otp"]) and not otp_verified,
            "created_at": row["created_at"]
        })

    conn.close()
    return jsonify({"success": True, "files": files_list})

@files_bp.route("/upload", methods=["POST"])
def upload_file():
    if "file" not in request.files:
        return jsonify({"success": False, "error": "No file provided in form-data"}), 400

    uploaded = request.files["file"]
    if not uploaded or uploaded.filename == "":
        return jsonify({"success": False, "error": "Empty filename"}), 400

    conn = get_db_connection()
    cursor = conn.cursor()

    # Get current session risk
    cursor.execute("SELECT * FROM session_state WHERE user_id = 1")
    session = cursor.fetchone()
    current_score = session["risk_score"] if session else 20
    current_level = session["risk_level"] if session else "LOW"

    # Determine encryption policy based on risk
    policy = SECURITY_POLICIES.get(current_level, SECURITY_POLICIES["LOW"])
    key_bits = policy["key_bits"]
    requires_otp = 1 if current_level == "HIGH" else 0

    # Read file content
    content = uploaded.read()
    orig_name = uploaded.filename
    clean_name = secure_filename(orig_name) or "uploaded_document"
    ext = os.path.splitext(clean_name)[1].replace(".", "").upper() or "BIN"

    # Encrypt file data dynamically using Adaptive Crypto Engine
    crypto_result = CryptoEngine.encrypt_data(content, key_bits=key_bits)

    timestamp_prefix = int(datetime.now().timestamp())
    stored_filename = f"{timestamp_prefix}_{clean_name}.enc"
    storage_path = os.path.join(STORAGE_DIR, stored_filename)

    with open(storage_path, "wb") as f:
        f.write(crypto_result["encrypted_payload"])

    cursor.execute("""
    INSERT INTO files (
        user_id, filename, original_name, file_type, file_size, storage_path,
        risk_score, risk_level, encryption_algo, key_size_bits,
        nonce_hex, auth_tag_hex, salt_hex, plaintext_hash, encrypted_hash,
        status, requires_otp, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    """, (
        1, stored_filename, orig_name, ext, len(content), storage_path,
        current_score, current_level, crypto_result["algorithm"], key_bits,
        crypto_result["nonce_hex"], crypto_result["auth_tag_hex"], crypto_result["salt_hex"],
        crypto_result["plaintext_hash"], crypto_result["encrypted_hash"],
        policy["status_label"], requires_otp
    ))
    new_id = cursor.lastrowid

    # Add security event
    event_title = f"{policy['encryption']} Protection Applied"
    event_desc = f"File '{orig_name}' dynamically secured with {crypto_result['algorithm']} based on active session risk score {current_score} ({current_level})."
    cursor.execute("""
    INSERT INTO security_events (user_id, event_type, risk_score, severity, title, description, ip_address)
    VALUES (1, 'FILE_ENCRYPT', ?, ?, ?, ?, ?)
    """, (current_score, current_level, event_title, event_desc, session["last_ip"] if session else "127.0.0.1"))

    conn.commit()
    conn.close()

    return jsonify({
        "success": True,
        "message": f"File encrypted and stored with {crypto_result['algorithm']}",
        "file": {
            "id": new_id,
            "original_name": orig_name,
            "file_type": ext,
            "file_size": len(content),
            "risk_score": current_score,
            "risk_level": current_level,
            "encryption_algo": crypto_result["algorithm"],
            "key_size_bits": key_bits,
            "requires_otp": bool(requires_otp),
            "plaintext_hash": crypto_result["plaintext_hash"],
            "encrypted_hash": crypto_result["encrypted_hash"]
        }
    }), 201

@files_bp.route("/<int:file_id>/download", methods=["GET"])
def download_file(file_id):
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM files WHERE id = ?", (file_id,))
    file_record = cursor.fetchone()
    if not file_record:
        conn.close()
        return jsonify({"success": False, "error": "File not found"}), 404

    cursor.execute("SELECT otp_verified FROM session_state WHERE user_id = 1")
    session = cursor.fetchone()
    otp_verified = bool(session["otp_verified"]) if session else False

    # Enforce Adaptive Security Guard: If file requires OTP and user hasn't verified OTP yet
    if bool(file_record["requires_otp"]) and not otp_verified:
        # Log unauthorized access attempt
        cursor.execute("""
        INSERT INTO security_events (user_id, event_type, risk_score, severity, title, description, ip_address)
        VALUES (1, 'ACCESS_BLOCKED', 85, 'HIGH', 'Data Access Challenge Enforced', ?, ?)
        """, (f"Download blocked for high-risk file '{file_record['original_name']}'. OTP verification required.", '127.0.0.1'))
        conn.commit()
        conn.close()
        return jsonify({
            "success": False,
            "requires_otp": True,
            "error": "Two-factor OTP challenge required. Please verify your OTP to download high-risk protected assets."
        }), 403

    storage_path = file_record["storage_path"]
    if not os.path.exists(storage_path):
        conn.close()
        return jsonify({"success": False, "error": "Encrypted file payload missing from storage"}), 404

    with open(storage_path, "rb") as f:
        encrypted_bytes = f.read()

    try:
        decrypted_bytes = CryptoEngine.decrypt_data(
            ciphertext_with_tag=encrypted_bytes,
            salt_hex=file_record["salt_hex"],
            nonce_hex=file_record["nonce_hex"],
            key_bits=file_record["key_size_bits"]
        )
    except Exception as e:
        conn.close()
        return jsonify({"success": False, "error": f"Decryption integrity failure: {str(e)}"}), 500

    # Log successful decryption download
    cursor.execute("""
    INSERT INTO security_events (user_id, event_type, risk_score, severity, title, description, ip_address)
    VALUES (1, 'FILE_DECRYPT', ?, 'INFO', 'Decryption & Export Authorized', ?, ?)
    """, (file_record["risk_score"], f"File '{file_record['original_name']}' successfully decrypted and served.", '127.0.0.1'))
    conn.commit()
    conn.close()

    return send_file(
        io.BytesIO(decrypted_bytes),
        as_attachment=True,
        download_name=file_record["original_name"],
        mimetype="application/octet-stream"
    )

@files_bp.route("/<int:file_id>/inspect", methods=["GET"])
def inspect_file(file_id):
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM files WHERE id = ?", (file_id,))
    file_record = cursor.fetchone()
    if not file_record:
        conn.close()
        return jsonify({"success": False, "error": "File not found"}), 404

    specs = CryptoEngine.get_security_details(file_record["key_size_bits"])

    details = {
        "id": file_record["id"],
        "original_name": file_record["original_name"],
        "file_type": file_record["file_type"],
        "file_size": file_record["file_size"],
        "risk_score": file_record["risk_score"],
        "risk_level": file_record["risk_level"],
        "encryption_algo": file_record["encryption_algo"],
        "key_size_bits": file_record["key_size_bits"],
        "status": file_record["status"],
        "requires_otp": bool(file_record["requires_otp"]),
        "crypto_metadata": {
            "cipher": "AES (Advanced Encryption Standard)",
            "cipher_mode": "Galois/Counter Mode (GCM) - Authenticated Encryption",
            "key_derivation": "PBKDF2-HMAC-SHA256 (100,000 iterations)",
            "salt_hex": file_record["salt_hex"],
            "nonce_iv_hex": file_record["nonce_hex"],
            "auth_tag_hex": file_record["auth_tag_hex"],
            "plaintext_sha256": file_record["plaintext_hash"],
            "ciphertext_sha256": file_record["encrypted_hash"],
            "security_margin": specs["security_margin"],
            "quantum_resistance": specs["quantum_resistance"],
            "operational_overhead": specs["overhead"]
        },
        "created_at": file_record["created_at"]
    }

    conn.close()
    return jsonify({"success": True, "inspection": details})

@files_bp.route("/<int:file_id>", methods=["DELETE"])
def delete_file(file_id):
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM files WHERE id = ?", (file_id,))
    file_record = cursor.fetchone()
    if not file_record:
        conn.close()
        return jsonify({"success": False, "error": "File not found"}), 404

    # Remove storage file
    if os.path.exists(file_record["storage_path"]):
        try:
            os.remove(file_record["storage_path"])
        except Exception:
            pass

    cursor.execute("DELETE FROM files WHERE id = ?", (file_id,))
    cursor.execute("""
    INSERT INTO security_events (user_id, event_type, risk_score, severity, title, description, ip_address)
    VALUES (1, 'FILE_PURGE', ?, 'INFO', 'File Cryptographic Erasure', ?, ?)
    """, (file_record["risk_score"], f"Purged file '{file_record['original_name']}' from secure vault.", '127.0.0.1'))

    conn.commit()
    conn.close()
    return jsonify({"success": True, "message": "File deleted successfully"})
