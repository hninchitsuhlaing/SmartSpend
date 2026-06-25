from flask import Blueprint, request
from flask_jwt_extended import jwt_required
import bcrypt
from app import db
from app.common.utils import success_response, error_response, get_current_user, parse_date

settings_bp = Blueprint("settings", __name__)


@settings_bp.route("/profile", methods=["GET"])
@jwt_required()
def get_profile():
    user = get_current_user()
    if not user:
        return error_response("User not found", 404)
    return success_response(user.to_dict())


@settings_bp.route("/profile", methods=["PUT"])
@jwt_required()
def update_profile():
    user = get_current_user()
    if not user:
        return error_response("User not found", 404)

    data = request.get_json() or {}
    if "full_name" in data:
        user.full_name = data["full_name"]
    if "username" in data and data["username"] != user.username:
        from app.models import User
        if User.query.filter_by(username=data["username"]).first():
            return error_response("Username already taken", 409)
        user.username = data["username"]
    if "phone" in data:
        user.phone = data["phone"]
    if "country" in data:
        user.country = data["country"]
    if "date_of_birth" in data and data["date_of_birth"]:
        try:
            user.date_of_birth = parse_date(data["date_of_birth"])
        except ValueError:
            return error_response("Invalid date format", 400)

    db.session.commit()
    return success_response(user.to_dict(), "Profile updated")


@settings_bp.route("/preferences", methods=["PUT"])
@jwt_required()
def update_preferences():
    user = get_current_user()
    if not user:
        return error_response("User not found", 404)

    data = request.get_json() or {}
    if "preferred_currency" in data:
        user.preferred_currency = data["preferred_currency"]
    if "theme" in data:
        user.theme = data["theme"]
    if "date_format" in data:
        user.date_format = data["date_format"]
    if "timezone" in data:
        user.timezone = data["timezone"]

    db.session.commit()
    return success_response(user.to_dict(), "Preferences updated")


@settings_bp.route("/change-password", methods=["POST"])
@jwt_required()
def change_password():
    user = get_current_user()
    if not user:
        return error_response("User not found", 404)

    data = request.get_json() or {}
    current_pw = data.get("current_password", "")
    new_pw = data.get("new_password", "")
    confirm_pw = data.get("confirm_password", "")

    if not bcrypt.checkpw(current_pw.encode(), user.password_hash.encode()):
        return error_response("Current password is incorrect", 400)
    if new_pw != confirm_pw:
        return error_response("Passwords do not match", 400)
    if len(new_pw) < 6:
        return error_response("Password must be at least 6 characters", 400)

    user.password_hash = bcrypt.hashpw(new_pw.encode(), bcrypt.gensalt(12)).decode()
    db.session.commit()
    return success_response(message="Password changed successfully")


@settings_bp.route("/currencies", methods=["GET"])
@jwt_required()
def get_currencies():
    currencies = [
        {"code": "THB", "name": "Thai Baht", "symbol": "฿"},
        {"code": "USD", "name": "US Dollar", "symbol": "$"},
        {"code": "EUR", "name": "Euro", "symbol": "€"},
        {"code": "GBP", "name": "British Pound", "symbol": "£"},
        {"code": "JPY", "name": "Japanese Yen", "symbol": "¥"},
        {"code": "SGD", "name": "Singapore Dollar", "symbol": "S$"},
        {"code": "AUD", "name": "Australian Dollar", "symbol": "A$"},
        {"code": "CAD", "name": "Canadian Dollar", "symbol": "C$"},
        {"code": "CNY", "name": "Chinese Yuan", "symbol": "¥"},
        {"code": "KRW", "name": "South Korean Won", "symbol": "₩"},
    ]
    return success_response(currencies)
