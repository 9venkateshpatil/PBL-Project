from flask import Blueprint, jsonify
from database import get_db_connection

analytics_bp = Blueprint("analytics", __name__)

@analytics_bp.route("", methods=["GET"])
def get_analytics():
    conn = get_db_connection()
    cursor = conn.cursor()

    # 1. Total Files & Storage
    cursor.execute("SELECT COUNT(*) as total_files, COALESCE(SUM(file_size), 0) as total_size FROM files")
    files_stat = cursor.fetchone()
    total_files = files_stat["total_files"]
    total_size = files_stat["total_size"]

    # 2. Files by Risk Level
    cursor.execute("""
    SELECT risk_level, COUNT(*) as count
    FROM files
    GROUP BY risk_level
    """)
    risk_level_rows = cursor.fetchall()
    risk_dist = {"LOW": 0, "MEDIUM": 0, "HIGH": 0}
    for r in risk_level_rows:
        if r["risk_level"] in risk_dist:
            risk_dist[r["risk_level"]] = r["count"]

    # 3. Encryption Usage Distribution
    cursor.execute("""
    SELECT key_size_bits, COUNT(*) as count
    FROM files
    GROUP BY key_size_bits
    """)
    enc_rows = cursor.fetchall()
    encryption_dist = {"AES-128": 0, "AES-192": 0, "AES-256": 0}
    for r in enc_rows:
        bits = r["key_size_bits"]
        if bits == 128:
            encryption_dist["AES-128"] = r["count"]
        elif bits == 192:
            encryption_dist["AES-192"] = r["count"]
        elif bits == 256:
            encryption_dist["AES-256"] = r["count"]

    # 4. Security Events Stats
    cursor.execute("SELECT COUNT(*) as total_events FROM security_events")
    total_events = cursor.fetchone()["total_events"]

    cursor.execute("""
    SELECT severity, COUNT(*) as count
    FROM security_events
    GROUP BY severity
    """)
    severity_rows = cursor.fetchall()
    severity_dist = {"INFO": 0, "MEDIUM": 0, "HIGH": 0}
    for r in severity_rows:
        if r["severity"] in severity_dist:
            severity_dist[r["severity"]] = r["count"]

    # 5. Security Actions Taken count
    cursor.execute("""
    SELECT COUNT(*) as actions_count
    FROM security_events
    WHERE event_type IN ('POLICY_ENFORCE', 'ACCESS_BLOCKED', 'OTP_VERIFIED', 'FILE_ENCRYPT')
    """)
    actions_count = cursor.fetchone()["actions_count"]

    # 6. Event Activity Histogram (by date / recent chunks)
    cursor.execute("""
    SELECT substr(created_at, 12, 5) as time_slot, risk_score, severity, event_type
    FROM security_events
    ORDER BY id ASC
    LIMIT 15
    """)
    timeline_rows = cursor.fetchall()
    timeline_data = [
        {"time": r["time_slot"], "score": r["risk_score"], "severity": r["severity"], "type": r["event_type"]}
        for r in timeline_rows
    ]

    # Current session state
    cursor.execute("SELECT * FROM session_state WHERE user_id = 1")
    session = cursor.fetchone()

    conn.close()

    return jsonify({
        "success": True,
        "metrics": {
            "total_files": total_files,
            "protected_files": total_files,
            "total_size_bytes": total_size,
            "total_events": total_events,
            "security_actions_taken": actions_count,
            "current_session_risk": session["risk_score"] if session else 20,
            "current_session_level": session["risk_level"] if session else "LOW",
            "low_risk_sessions": 28,   # SOC simulation metrics
            "medium_risk_sessions": 14,
            "high_risk_sessions": 5
        },
        "risk_distribution": risk_dist,
        "encryption_distribution": encryption_dist,
        "severity_distribution": severity_dist,
        "activity_timeline": timeline_data
    })
