from flask import Blueprint, request, jsonify
import hashlib
import json
from database import get_db_connection
from risk_engine import RiskEngine

auth_bp = Blueprint("auth", __name__)

@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json() or {}
    email = data.get("email", "").strip()
    password = data.get("password", "").strip()

    if not email or not password:
        return jsonify({"success": False, "error": "Email and password are required"}), 400

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM users WHERE email = ?", (email,))
    user = cursor.fetchone()

    pw_hash = hashlib.sha256(password.encode("utf-8")).hexdigest()

    if not user or user["password_hash"] != pw_hash:
        # Log failed attempt
        cursor.execute("""
        INSERT INTO security_events (user_id, event_type, risk_score, severity, title, description, ip_address)
        VALUES (NULL, 'AUTH_FAILED', 40, 'MEDIUM', 'Authentication Challenge Failed', ?, ?)
        """, (f"Invalid credentials submitted for {email}", request.remote_addr or '127.0.0.1'))
        conn.commit()
        conn.close()
        return jsonify({"success": False, "error": "Invalid email or password"}), 401

    # Fetch or create session state
    cursor.execute("SELECT * FROM session_state WHERE user_id = ?", (user["id"],))
    session = cursor.fetchone()

    # Log successful login
    cursor.execute("""
    INSERT INTO security_events (user_id, event_type, risk_score, severity, title, description, ip_address)
    VALUES (?, 'AUTH_LOGIN', ?, 'INFO', 'User Authentication Succeeded', ?, ?)
    """, (user["id"], session["risk_score"] if session else 20, f"Operator {user['name']} initialized session.", request.remote_addr or '127.0.0.1'))
    conn.commit()

    user_data = {
        "id": user["id"],
        "email": user["email"],
        "name": user["name"],
        "role": user["role"]
    }

    session_data = {
        "risk_score": session["risk_score"] if session else 20,
        "risk_level": session["risk_level"] if session else "LOW",
        "active_factors": json.loads(session["active_factors"]) if session and session["active_factors"] else {},
        "otp_verified": bool(session["otp_verified"]) if session else False,
        "device_name": session["device_name"] if session else "Workstation",
        "last_ip": session["last_ip"] if session else "192.168.1.104"
    }

    conn.close()
    return jsonify({
        "success": True,
        "user": user_data,
        "session": session_data,
        "token": f"jwt-mock-cloudcrypt-token-{user['id']}"
    })

@auth_bp.route("/quick-login", methods=["POST"])
def quick_login():
    """Preset demo logins for swift presentation during project viva."""
    data = request.get_json() or {}
    mode = data.get("mode", "low")  # "low", "medium", "high"

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM users WHERE id = 1")
    user = cursor.fetchone()
    if not user:
        conn.close()
        return jsonify({"success": False, "error": "User not found"}), 404

    # Determine risk factors based on requested demo mode
    if mode == "high":
        factors = {"new_device": True, "unknown_ip": True, "unusual_time": False, "failed_logins": True, "suspicious_download": False, "unusual_location": True}
        ip = "198.51.100.77"
        device = "Unrecognized Linux Endpoint (Tor/VPN)"
    elif mode == "medium":
        factors = {"new_device": True, "unknown_ip": False, "unusual_time": True, "failed_logins": False, "suspicious_download": False, "unusual_location": False}
        ip = "172.16.4.12"
        device = "Remote iOS Safari (Cellular 5G)"
    else:  # low
        factors = {"new_device": False, "unknown_ip": False, "unusual_time": False, "failed_logins": False, "suspicious_download": False, "unusual_location": False}
        ip = "192.168.1.104"
        device = "Corporate Secure Node (Ubuntu/X11)"

    eval_result = RiskEngine.evaluate(factors)

    cursor.execute("""
    UPDATE session_state
    SET risk_score = ?, risk_level = ?, active_factors = ?, otp_verified = 0, last_ip = ?, device_name = ?, updated_at = CURRENT_TIMESTAMP
    WHERE user_id = ?
    """, (eval_result["score"], eval_result["level"], json.dumps(factors), ip, device, user["id"]))

    cursor.execute("""
    INSERT INTO security_events (user_id, event_type, risk_score, severity, title, description, ip_address)
    VALUES (?, 'AUTH_LOGIN', ?, ?, 'Demo Preset Session Initialized', ?, ?)
    """, (user["id"], eval_result["score"], eval_result["level"], f"Quick login engaged with {eval_result['level']} risk profile.", ip))

    conn.commit()

    user_data = {
        "id": user["id"],
        "email": user["email"],
        "name": user["name"],
        "role": user["role"]
    }

    session_data = {
        "risk_score": eval_result["score"],
        "risk_level": eval_result["level"],
        "active_factors": factors,
        "policy": eval_result["policy"],
        "otp_verified": False,
        "device_name": device,
        "last_ip": ip
    }

    conn.close()
    return jsonify({
        "success": True,
        "user": user_data,
        "session": session_data,
        "token": f"jwt-mock-cloudcrypt-token-{user['id']}"
    })

@auth_bp.route("/session", methods=["GET"])
def get_session():
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM users WHERE id = 1")
    user = cursor.fetchone()
    if not user:
        conn.close()
        return jsonify({"success": False, "error": "No user"}), 404

    cursor.execute("SELECT * FROM session_state WHERE user_id = 1")
    session = cursor.fetchone()

    active_factors = json.loads(session["active_factors"]) if session and session["active_factors"] else {}
    eval_result = RiskEngine.evaluate(active_factors)

    res = {
        "success": True,
        "user": {
            "id": user["id"],
            "email": user["email"],
            "name": user["name"],
            "role": user["role"]
        },
        "session": {
            "risk_score": session["risk_score"] if session else eval_result["score"],
            "risk_level": session["risk_level"] if session else eval_result["level"],
            "active_factors": active_factors,
            "detected_factors": eval_result["detected_factors"],
            "policy": eval_result["policy"],
            "otp_verified": bool(session["otp_verified"]) if session else False,
            "device_name": session["device_name"] if session else "Workstation",
            "last_ip": session["last_ip"] if session else "192.168.1.104"
        }
    }
    conn.close()
    return jsonify(res)

@auth_bp.route("/verify-otp", methods=["POST"])
def verify_otp():
    data = request.get_json() or {}
    code = data.get("code", "").strip()

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT otp_secret FROM users WHERE id = 1")
    user = cursor.fetchone()

    # Valid if matches user otp_secret (749215) or general testing code "123456"
    is_valid = code in [user["otp_secret"], "123456", "749215"]

    if is_valid:
        cursor.execute("UPDATE session_state SET otp_verified = 1 WHERE user_id = 1")
        cursor.execute("""
        INSERT INTO security_events (user_id, event_type, risk_score, severity, title, description, ip_address)
        VALUES (1, 'OTP_VERIFIED', 20, 'INFO', 'Two-Factor Challenge Passed', 'OTP verified successfully. Download restriction unlocked.', '127.0.0.1')
        """)
        conn.commit()
        conn.close()
        return jsonify({"success": True, "message": "Two-factor authentication verified successfully."})
    else:
        cursor.execute("""
        INSERT INTO security_events (user_id, event_type, risk_score, severity, title, description, ip_address)
        VALUES (1, 'OTP_FAILED', 85, 'HIGH', 'Two-Factor Challenge Failed', 'Invalid OTP token supplied. Access remains restricted.', '127.0.0.1')
        """)
        conn.commit()
        conn.close()
        return jsonify({"success": False, "error": "Invalid verification code. Use demo code: 749215"}), 400
