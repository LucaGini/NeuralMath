from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from jose import jwt, JWTError
from app.core.database import get_db
from app.core.security import get_password_hash, verify_password, create_access_token, ALGORITHM
from app.core.config import settings
from app.models.user import User
from app.schemas.user import UserCreate, UserResponse, Token, TokenPayload, UserUpdate
from pydantic import BaseModel, EmailStr

router = APIRouter(prefix="/auth", tags=["auth"])

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

# Current user dependency
def get_current_user(request: Request, db: Session = Depends(get_db)) -> User:
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header missing or invalid",
            headers={"WWW-Authenticate": "Bearer"},
        )
    token = auth_header.split(" ")[1]
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = db.query(User).filter(User.id == int(user_id)).first()
    if user is None:
        raise credentials_exception
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="La cuenta está inactiva o ha sido desactivada por el administrador.",
        )
    return user

def get_current_admin_user(current_user: User = Depends(get_current_user)) -> User:
    if not current_user.is_admin:
        import logging
        logging.getLogger(__name__).warning(f"Unauthorized admin access attempt by user: {current_user.email}")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acceso restringido únicamente a administradores.",
        )
    return current_user

@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    # Check if user already exists
    existing_user = db.query(User).filter(User.email == user_in.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email already exists."
        )
    
    # Hash password
    hashed_password = get_password_hash(user_in.password)
    
    # Create user
    new_user = User(
        name=user_in.name,
        email=user_in.email,
        password_hash=hashed_password,
        level=user_in.level,
        is_admin=False,
        is_active=True
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Generate token
    token = create_access_token(subject=new_user.id)
    return {"access_token": token, "token_type": "bearer"}

@router.post("/login", response_model=Token)
def login(login_data: LoginRequest, db: Session = Depends(get_db)):
    # Validate email
    user = db.query(User).filter(User.email == login_data.email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect email or password"
        )
    
    # Check if trying admin
    is_trying_admin = user.is_admin
    
    # Validate password
    if not verify_password(login_data.password, user.password_hash):
        if is_trying_admin:
            import logging
            logging.getLogger(__name__).warning(f"Failed admin login attempt for user: {user.email}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect email or password"
        )
        
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La cuenta ha sido desactivada por el administrador."
        )
    
    # Generate token
    token = create_access_token(subject=user.id)
    return {"access_token": token, "token_type": "bearer"}


@router.get("/me", response_model=UserResponse)
def read_user_me(current_user: User = Depends(get_current_user)):
    return current_user

@router.put("/me", response_model=UserResponse)
def update_user_me(
    update_data: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if update_data.name is not None:
        current_user.name = update_data.name
    if update_data.level is not None:
        current_user.level = update_data.level
    if update_data.password is not None and update_data.password.strip() != "":
        if current_user.email == "estudiante@neuralmath.edu":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No está permitido cambiar la contraseña del usuario de demostración."
            )
        current_user.password_hash = get_password_hash(update_data.password)
    
    db.commit()
    db.refresh(current_user)
    return current_user

class ResetPasswordRequest(BaseModel):
    email: EmailStr
    new_password: str

@router.post("/reset-password")
def reset_password(data: ResetPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No se encontró ningún usuario con ese correo electrónico."
        )
    if user.email == "estudiante@neuralmath.edu":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No está permitido restablecer la contraseña del usuario de demostración."
        )
    user.password_hash = get_password_hash(data.new_password)
    db.commit()
    return {"message": "Contraseña restablecida con éxito."}
