"""
Simple test script to verify server setup
Run this after installing dependencies to check if everything works
"""
import sys

print("=" * 60)
print("  Server Setup Verification")
print("=" * 60)
print()

# Check Python version
print(f"✓ Python version: {sys.version}")
print()

# Check required packages
packages = {
    'fastapi': 'FastAPI',
    'uvicorn': 'Uvicorn',
    'motor': 'Motor (MongoDB async driver)',
    'pymongo': 'PyMongo',
    'paho.mqtt.client': 'Paho MQTT',
    'pydantic': 'Pydantic',
    'pydantic_settings': 'Pydantic Settings',
}

print("Checking required packages:")
print("-" * 60)

all_ok = True
for package, name in packages.items():
    try:
        __import__(package)
        print(f"✓ {name:30s} - OK")
    except ImportError:
        print(f"✗ {name:30s} - MISSING")
        all_ok = False

print()

# Check optional packages (ML)
print("Checking optional packages (for ML prediction):")
print("-" * 60)

optional_packages = {
    'tensorflow': 'TensorFlow',
    'keras': 'Keras',
    'numpy': 'NumPy',
    'pandas': 'Pandas',
    'sklearn': 'Scikit-learn',
}

for package, name in optional_packages.items():
    try:
        __import__(package)
        print(f"✓ {name:30s} - OK")
    except ImportError:
        print(f"⚠ {name:30s} - MISSING (will use simple prediction)")

print()

# Check alert packages
print("Checking alert packages:")
print("-" * 60)

try:
    import telegram
    print(f"✓ {'python-telegram-bot':30s} - OK")
except ImportError:
    print(f"⚠ {'python-telegram-bot':30s} - MISSING (alerts disabled)")

print()
print("=" * 60)

if all_ok:
    print("✓ All required packages installed!")
    print()
    print("Next steps:")
    print("1. Copy .env.example to .env and configure")
    print("2. Setup MongoDB Atlas or local MongoDB")
    print("3. Run: python -m app.main")
    print("4. Visit: http://localhost:8000/docs")
else:
    print("✗ Some required packages are missing!")
    print()
    print("Install missing packages:")
    print("  pip install -r requirements.txt")

print("=" * 60)
