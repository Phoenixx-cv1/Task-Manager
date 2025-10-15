"""
Script to create an admin user in the database.
Run this once to create your first admin account.
"""
from passlib.hash import sha256_crypt
from updatabase import SessionLocal, Base, engine
from upmodels import User

def create_admin():
    # Create tables if they don't exist
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    
    try:
        # Check if admin already exists
        existing_admin = db.query(User).filter(User.username == "admin").first()
        if existing_admin:
            print("❌ Admin user already exists!")
            return
        
        # Get admin credentials
        print("=== Create Admin Account ===")
        username = input("Enter admin username (default: admin): ").strip() or "admin"
        password = input("Enter admin password (default: admin123): ").strip() or "admin123"
        
        # Hash password
        hashed_password = sha256_crypt.hash(password)
        
        # Create admin user
        admin = User(
            username=username,
            hashed_password=hashed_password,
            role="admin"
        )
        
        db.add(admin)
        db.commit()
        db.refresh(admin)
        
        print(f"\n✅ Admin user '{username}' created successfully!")
        print(f"   ID: {admin.id}")
        print(f"   Role: {admin.role}")
        print("\n⚠️  IMPORTANT: Remember your credentials!")
        print(f"   Username: {username}")
        print(f"   Password: {password}")
        
    except Exception as e:
        print(f"\n❌ Error creating admin: {str(e)}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_admin()
