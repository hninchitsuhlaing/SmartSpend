from flask import Blueprint, request
from flask_jwt_extended import (
    create_access_token, create_refresh_token,
    jwt_required, get_jwt_identity
)
import bcrypt
from app import db
from app.models import User, ExpenseCategory, IncomeSource
from app.common.utils import success_response, error_response, get_current_user

auth_bp = Blueprint("auth", __name__)

DEFAULT_CATEGORIES = [
    {"name": "Food & Dining", "color": "#f59e0b", "icon": "utensils"},
    {"name": "Transport", "color": "#3b82f6", "icon": "car"},
    {"name": "Bills & Utilities", "color": "#8b5cf6", "icon": "file-text"},
    {"name": "Entertainment", "color": "#ec4899", "icon": "film"},
    {"name": "Shopping", "color": "#10b981", "icon": "shopping-bag"},
    {"name": "Health", "color": "#ef4444", "icon": "heart"},
    {"name": "Education", "color": "#06b6d4", "icon": "book"},
    {"name": "Other", "color": "#6b7280", "icon": "tag"},
]

DEFAULT_SOURCES = [
    {"name": "Salary", "type": "Salary"},
    {"name": "Freelance", "type": "Freelance"},
    {"name": "Investment", "type": "Investment"},
    {"name": "Other", "type": "Other"},
]


@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json()
    if not data:
        return error_response("Request body required", 400)

    username = data.get("username", "").strip()
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")
    full_name = data.get("full_name", "").strip()

    if not username or not email or not password:
        return error_response("Username, email, and password are required", 400)
    if len(password) < 6:
        return error_response("Password must be at least 6 characters", 400)
    if User.query.filter_by(email=email).first():
        return error_response("Email already registered", 409)
    if User.query.filter_by(username=username).first():
        return error_response("Username already taken", 409)

    pw_hash = bcrypt.hashpw(password.encode(), bcrypt.gensalt(12)).decode()
    user = User(
        username=username,
        email=email,
        password_hash=pw_hash,
        full_name=full_name or username,
    )
    db.session.add(user)
    db.session.flush()

    # Seed default categories and income sources
    for cat in DEFAULT_CATEGORIES:
        db.session.add(ExpenseCategory(user_id=user.id, **cat))
    for src in DEFAULT_SOURCES:
        db.session.add(IncomeSource(user_id=user.id, **src))

    db.session.commit()

    access_token = create_access_token(identity=str(user.id))
    refresh_token = create_refresh_token(identity=str(user.id))

    return success_response({
        "user": user.to_dict(),
        "access_token": access_token,
        "refresh_token": refresh_token,
    }, "Account created successfully", 201)


@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json()
    if not data:
        return error_response("Request body required", 400)

    email = data.get("email", "").strip().lower()
    password = data.get("password", "")

    user = User.query.filter_by(email=email).first()
    if not user or not bcrypt.checkpw(password.encode(), user.password_hash.encode()):
        return error_response("Invalid email or password", 401)
    if not user.is_active:
        return error_response("Account is disabled", 403)

    access_token = create_access_token(identity=str(user.id))
    refresh_token = create_refresh_token(identity=str(user.id))

    return success_response({
        "user": user.to_dict(),
        "access_token": access_token,
        "refresh_token": refresh_token,
    }, "Login successful")


@auth_bp.route("/refresh", methods=["POST"])
@jwt_required(refresh=True)
def refresh():
    user_id = get_jwt_identity()
    access_token = create_access_token(identity=str(user_id))
    return success_response({"access_token": access_token})


@auth_bp.route("/me", methods=["GET"])
@jwt_required()
def get_me():
    user = get_current_user()
    if not user:
        return error_response("User not found", 404)
    return success_response(user.to_dict())


@auth_bp.route("/logout", methods=["POST"])
@jwt_required()
def logout():
    return success_response(message="Logged out successfully")
