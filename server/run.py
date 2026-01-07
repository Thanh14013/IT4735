"""
Quick start script to run the server
"""
import os
import sys

def main():
    print("=" * 60)
    print("  Starting Air Quality Monitoring Server")
    print("=" * 60)
    print()
    
    # Check if .env exists
    if not os.path.exists('.env'):
        print("⚠️  Warning: .env file not found!")
        print()
        print("Quick setup:")
        print("1. Copy .env.example to .env")
        print("2. Edit .env with your MongoDB connection string")
        print()
        
        choice = input("Continue with default settings? (y/n): ")
        if choice.lower() != 'y':
            print("Setup cancelled. Please create .env file first.")
            sys.exit(1)
    
    # Import and run
    try:
        import uvicorn
        from app.config import settings
        
        print()
        print(f"Server will start on: http://{settings.host}:{settings.port}")
        print(f"API docs: http://{settings.host}:{settings.port}/docs")
        print()
        print("Press Ctrl+C to stop")
        print("=" * 60)
        print()
        
        uvicorn.run(
            "app.main:app",
            host=settings.host,
            port=settings.port,
            reload=settings.debug,
            log_level="info"
        )
        
    except ImportError as e:
        print(f"❌ Error: {e}")
        print()
        print("Please install dependencies first:")
        print("  pip install -r requirements.txt")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Error starting server: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
