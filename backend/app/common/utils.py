from datetime import datetime, date
from flask import jsonify, request, current_app
from flask_jwt_extended import get_jwt_identity
from app.models import User


def get_current_user():
    user_id = int(get_jwt_identity())
    return User.query.get(user_id)


def success_response(data=None, message=None, status=200, meta=None):
    resp = {"success": True}
    if message:
        resp["message"] = message
    if data is not None:
        resp["data"] = data
    if meta:
        resp["meta"] = meta
    return jsonify(resp), status


def error_response(message, status=400, errors=None):
    resp = {"success": False, "message": message}
    if errors:
        resp["errors"] = errors
    return jsonify(resp), status


def get_pagination_params():
    try:
        page = max(1, int(request.args.get("page", 1)))
        per_page = min(int(request.args.get("per_page", 10)), 100)
    except (ValueError, TypeError):
        page, per_page = 1, 10
    return page, per_page


def parse_date(val):
    if not val:
        return None
    for fmt in ("%Y-%m-%d", "%d/%m/%Y", "%m/%d/%Y"):
        try:
            return datetime.strptime(val, fmt).date()
        except ValueError:
            pass
    raise ValueError(f"Cannot parse date: {val}")
