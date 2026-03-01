#!/bin/bash

# Clear Python cache
echo "Clearing Python cache..."
find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
find . -name "*.pyc" -delete 2>/dev/null || true

echo "Cache cleared!"
echo ""
echo "Starting backend with virtual environment..."
source venv/bin/activate && python3 app.py
