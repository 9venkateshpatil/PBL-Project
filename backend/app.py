import os
from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS
from config import FRONTEND_DIST_DIR
from database import init_db
from routes.auth import auth_bp
from routes.files import files_bp
from routes.risk import risk_bp
from routes.activity import activity_bp
from routes.analytics import analytics_bp

def create_app():
    app = Flask(__name__, static_folder=FRONTEND_DIST_DIR, static_url_path="")
    CORS(app)

    # Initialize SQLite database and demo dataset
    init_db()

    # Register API blueprints
    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(files_bp, url_prefix="/api/files")
    app.register_blueprint(risk_bp, url_prefix="/api/risk")
    app.register_blueprint(activity_bp, url_prefix="/api/activity")
    app.register_blueprint(analytics_bp, url_prefix="/api/analytics")

    @app.route("/api/health", methods=["GET"])
    def health_check():
        return jsonify({
            "status": "healthy",
            "service": "CloudCrypt Risk-Adaptive Backend",
            "version": "1.0.0",
            "crypto_engine": "AES-GCM (128/192/256-bit)"
        })

    # Serve built React frontend if dist exists
    @app.route("/", defaults={"path": ""})
    @app.route("/<path:path>")
    def serve_frontend(path):
        if path != "" and os.path.exists(os.path.join(app.static_folder, path)):
            return send_from_directory(app.static_folder, path)
        elif os.path.exists(os.path.join(app.static_folder, "index.html")):
            return send_from_directory(app.static_folder, "index.html")
        else:
            return jsonify({
                "message": "CloudCrypt API is running. Build frontend or run Vite dev server.",
                "endpoints": {
                    "health": "/api/health",
                    "auth": "/api/auth/session",
                    "files": "/api/files",
                    "risk": "/api/risk/status",
                    "activity": "/api/activity",
                    "analytics": "/api/analytics"
                }
            })

    return app

app = create_app()

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    print(f"\n==================================================")
    print(f"🔒 CloudCrypt Adaptive Security Engine Initialized")
    print(f"📡 API Gateway running on: http://127.0.0.1:{port}")
    print(f"==================================================\n")
    app.run(host="0.0.0.0", port=port, debug=True)
