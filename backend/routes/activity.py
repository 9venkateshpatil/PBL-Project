from flask import Blueprint, request, jsonify
from database import get_db_connection

activity_bp = Blueprint("activity", __name__)

@activity_bp.route("", methods=["GET"])
def get_activity_log():
    limit = request.args.get("limit", 50, type=int)
    severity_filter = request.args.get("severity", "").upper()
    search = request.args.get("search", "").strip()

    conn = get_db_connection()
    cursor = conn.cursor()

    query = "SELECT * FROM security_events WHERE 1=1"
    params = []

    if severity_filter and severity_filter != "ALL":
        query += " AND severity = ?"
        params.append(severity_filter)

    if search:
        query += " AND (title LIKE ? OR description LIKE ? OR event_type LIKE ?)"
        params.extend([f"%{search}%", f"%{search}%", f"%{search}%"])

    query += " ORDER BY id DESC LIMIT ?"
    params.append(limit)

    cursor.execute(query, tuple(params))
    rows = cursor.fetchall()

    events = []
    for r in rows:
        events.append({
            "id": r["id"],
            "event_type": r["event_type"],
            "risk_score": r["risk_score"],
            "severity": r["severity"],
            "title": r["title"],
            "description": r["description"],
            "ip_address": r["ip_address"],
            "created_at": r["created_at"]
        })

    conn.close()
    return jsonify({"success": True, "events": events})

@activity_bp.route("/clear", methods=["POST"])
def clear_activity_log():
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("DELETE FROM security_events")
    cursor.execute("""
    INSERT INTO security_events (user_id, event_type, risk_score, severity, title, description, ip_address)
    VALUES (1, 'SYS_MAINT', 15, 'INFO', 'Security Audit Trail Sanitized', 'Audit history reset by Lead Security Architect.', '127.0.0.1')
    """)

    conn.commit()
    conn.close()
    return jsonify({"success": True, "message": "Security logs cleared and re-initialized."})
