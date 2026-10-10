#!/usr/bin/env bash
# ==============================================================================
# CloudCrypt: Risk-Adaptive Encryption Framework for Secure Cloud Storage
# Academic B.Tech Cybersecurity Prototype Launch Script
# ==============================================================================

set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$DIR"

echo "=================================================================="
echo "🛡️  CLOUDCRYPT - RISK-ADAPTIVE ENCRYPTION FRAMEWORK"
echo "    Secure Cloud Storage Prototype with Heuristic Threat Modeling"
echo "=================================================================="

# Check Python environment
if [ -d "$DIR/venv" ]; then
    PYTHON="$DIR/venv/bin/python3"
else
    PYTHON="python3"
fi

# Check Node environment (if developer wants to run vite dev)
if [ -d "$DIR/.node/bin" ]; then
    export PATH="$DIR/.node/bin:$PATH"
fi

echo "🔹 Verifying backend dependencies..."
$PYTHON -c "import flask, cryptography, sqlite3; print('   Dependencies validated successfully.')" || {
    echo "⚠️  Missing dependencies. Installing from requirements.txt..."
    pip install -r backend/requirements.txt
}

# Check if frontend is built
if [ ! -d "$DIR/frontend/dist" ]; then
    echo "🔹 Building frontend assets with Vite..."
    cd "$DIR/frontend"
    npm run build
    cd "$DIR"
fi

echo ""
echo "🚀 Starting CloudCrypt Unified Full-Stack Gateway on port 5000..."
echo "------------------------------------------------------------------"
echo "🌐 URL:              http://127.0.0.1:5000"
echo "👤 Demo Operator:   secops@cloudcrypt.io"
echo "🔑 Demo Password:   cloudcrypt123"
echo "🔢 2FA / OTP Code:  749215"
echo "------------------------------------------------------------------"
echo "Press Ctrl+C to terminate the server."
echo ""

exec $PYTHON backend/app.py
