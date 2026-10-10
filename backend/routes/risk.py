import json
from flask import Blueprint, request, jsonify
from database import get_db_connection
from risk_engine import RiskEngine

risk_bp = Blueprint("risk", __name__)

@risk_bp.route("/status", methods=["GET"])
def get_risk_status():
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM session_state WHERE user_id = 1")
    session = cursor.fetchone()

    active_factors = json.loads(session["active_factors"]) if session and session["active_factors"] else {}
    eval_result = RiskEngine.evaluate(active_factors)

    conn.close()
    return jsonify({
        "success": True,
        "current_score": session["risk_score"] if session else eval_result["score"],
        "current_level": session["risk_level"] if session else eval_result["level"],
        "active_factors": active_factors,
        "detected_factors": eval_result["detected_factors"],
        "policy": eval_result["policy"],
        "otp_verified": bool(session["otp_verified"]) if session else False,
        "last_ip": session["last_ip"] if session else "192.168.1.104",
        "device_name": session["device_name"] if session else "Workstation",
        "thresholds": eval_result["thresholds"],
        "recommendation": eval_result["recommendation"]
    })

@risk_bp.route("/factors", methods=["GET"])
def get_factors():
    catalog = RiskEngine.get_factor_catalog()
    return jsonify({"success": True, "factors": catalog})

@risk_bp.route("/evaluate", methods=["POST"])
def evaluate_preview():
    """Live dynamic calculation endpoint for UI sliders/toggles without persisting."""
    data = request.get_json() or {}
    factors = data.get("factors", {})
    eval_result = RiskEngine.evaluate(factors)
    return jsonify({"success": True, "evaluation": eval_result})

@risk_bp.route("/simulate", methods=["POST"])
def apply_simulation():
    """
    Risk Simulator action: Recalculates risk and commits changes to session state,
    immediately transitioning system encryption policies and emitting audit events.
    """
    data = request.get_json() or {}
    factors = data.get("factors", {})

    eval_result = RiskEngine.evaluate(factors)
    score = eval_result["score"]
    level = eval_result["level"]
    policy = eval_result["policy"]

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM session_state WHERE user_id = 1")
    old_session = cursor.fetchone()
    old_score = old_session["risk_score"] if old_session else 20
    old_level = old_session["risk_level"] if old_session else "LOW"

    # Derive IP based on factors
    sim_ip = "198.51.100.77" if factors.get("unknown_ip") or factors.get("unusual_location") else "192.168.1.104"
    sim_device = "Untrusted Remote Shell (TOR/Proxy)" if factors.get("new_device") and factors.get("unusual_location") else (
        "New Workstation Fingerprint" if factors.get("new_device") else "Corporate Secure Node"
    )

    # If transitioning to HIGH or reset, reset OTP verification
    otp_verified = 0 if level == "HIGH" else (old_session["otp_verified"] if old_session else 0)

    cursor.execute("""
    UPDATE session_state
    SET risk_score = ?, risk_level = ?, active_factors = ?, otp_verified = ?, last_ip = ?, device_name = ?, updated_at = CURRENT_TIMESTAMP
    WHERE user_id = 1
    """, (score, level, json.dumps(factors), otp_verified, sim_ip, sim_device))

    # Log security audit events
    if level != old_level or abs(score - old_score) >= 15:
        # 1. Risk Evaluation Event
        cursor.execute("""
        INSERT INTO security_events (user_id, event_type, risk_score, severity, title, description, ip_address)
        VALUES (1, 'RISK_EVAL', ?, ?, ?, ?, ?)
        """, (
            score, level,
            f"Risk Score Recalculated: {score} / 100 ({level})",
            f"Risk engine detected {len(eval_result['detected_factors'])} risk vectors. Session profile updated.",
            sim_ip
        ))

        # 2. Policy Enforcement Event
        cursor.execute("""
        INSERT INTO security_events (user_id, event_type, risk_score, severity, title, description, ip_address)
        VALUES (1, 'POLICY_ENFORCE', ?, ?, ?, ?, ?)
        """, (
            score, level,
            f"Adaptive Defense Engaged: {policy['encryption']} Activated",
            f"System switched to {policy['encryption']} ({policy['status_label']}). {policy['description']}",
            sim_ip
        ))

    conn.commit()
    conn.close()

    return jsonify({
        "success": True,
        "message": f"Simulation applied. Risk score: {score} ({level}), Adaptive encryption: {policy['encryption']}",
        "session": {
            "risk_score": score,
            "risk_level": level,
            "policy": policy,
            "active_factors": factors,
            "detected_factors": eval_result["detected_factors"],
            "otp_verified": bool(otp_verified),
            "last_ip": sim_ip,
            "device_name": sim_device,
            "recommendation": eval_result["recommendation"]
        }
    })

@risk_bp.route("/reset", methods=["POST"])
def reset_risk():
    """Resets session risk state to clean low-risk baseline."""
    clean_factors = {
        "new_device": False,
        "unknown_ip": False,
        "unusual_time": False,
        "failed_logins": False,
        "suspicious_download": False,
        "unusual_location": False
    }
    eval_result = RiskEngine.evaluate(clean_factors, base_score=15)

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""
    UPDATE session_state
    SET risk_score = ?, risk_level = 'LOW', active_factors = ?, otp_verified = 0, last_ip = '192.168.1.104', device_name = 'Corporate Secure Node (Ubuntu/X11)', updated_at = CURRENT_TIMESTAMP
    WHERE user_id = 1
    """, (eval_result["score"], json.dumps(clean_factors)))

    cursor.execute("""
    INSERT INTO security_events (user_id, event_type, risk_score, severity, title, description, ip_address)
    VALUES (1, 'POLICY_ENFORCE', 15, 'INFO', 'Risk Telemetry Reset to Baseline (15/100)', 'Session restored to trusted status. AES-128 protection reactivated.', '192.168.1.104')
    """)

    conn.commit()
    conn.close()

    return jsonify({
        "success": True,
        "message": "Risk factors reset to trusted baseline.",
        "session": {
            "risk_score": eval_result["score"],
            "risk_level": "LOW",
            "policy": eval_result["policy"],
            "active_factors": clean_factors,
            "detected_factors": [],
            "otp_verified": False,
            "last_ip": "192.168.1.104",
            "device_name": "Corporate Secure Node (Ubuntu/X11)"
        }
    })
