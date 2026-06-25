from flask import Blueprint, request
from flask_jwt_extended import jwt_required
from app import db
from app.models import Budget, Expense
from app.common.utils import success_response, error_response, get_current_user, parse_date
from datetime import date

budgets_bp = Blueprint("budgets", __name__)


def _budget_with_spending(budget, user_id):
    today = date.today()
    d_from = budget.start_date
    d_to = budget.end_date or today

    expenses = Expense.query.filter(
        Expense.user_id == user_id,
        Expense.category_id == budget.category_id,
        Expense.date >= d_from,
        Expense.date <= d_to,
    ).all() if budget.category_id else []

    spent = sum(float(e.amount) for e in expenses)
    budget_amount = float(budget.amount)
    remaining = budget_amount - spent
    progress = round((spent / budget_amount) * 100, 1) if budget_amount > 0 else 0

    result = budget.to_dict()
    result["spent"] = spent
    result["remaining"] = remaining
    result["progress"] = progress
    result["status"] = "over" if progress > 100 else ("at_risk" if progress >= 80 else "on_track")
    return result


@budgets_bp.route("/", methods=["GET"])
@jwt_required()
def list_budgets():
    user = get_current_user()
    if not user:
        return error_response("User not found", 404)

    budgets = Budget.query.filter_by(user_id=user.id).all()
    return success_response([_budget_with_spending(b, user.id) for b in budgets])


@budgets_bp.route("/", methods=["POST"])
@jwt_required()
def create_budget():
    user = get_current_user()
    if not user:
        return error_response("User not found", 404)

    data = request.get_json() or {}
    if not data.get("name") or not data.get("amount"):
        return error_response("name and amount are required", 400)

    try:
        start_date = parse_date(data.get("start_date", date.today().isoformat()))
        end_date = parse_date(data["end_date"]) if data.get("end_date") else None
    except ValueError:
        return error_response("Invalid date format", 400)

    budget = Budget(
        user_id=user.id,
        category_id=data.get("category_id"),
        name=data["name"],
        amount=float(data["amount"]),
        currency=data.get("currency", user.preferred_currency),
        period=data.get("period", "monthly"),
        start_date=start_date,
        end_date=end_date,
    )
    db.session.add(budget)
    db.session.commit()
    return success_response(_budget_with_spending(budget, user.id), "Budget created", 201)


@budgets_bp.route("/<int:budget_id>", methods=["PUT"])
@jwt_required()
def update_budget(budget_id):
    user = get_current_user()
    if not user:
        return error_response("User not found", 404)

    budget = Budget.query.filter_by(id=budget_id, user_id=user.id).first()
    if not budget:
        return error_response("Budget not found", 404)

    data = request.get_json() or {}
    if "name" in data:
        budget.name = data["name"]
    if "amount" in data:
        budget.amount = float(data["amount"])
    if "currency" in data:
        budget.currency = data["currency"]
    if "category_id" in data:
        budget.category_id = data["category_id"]
    if "period" in data:
        budget.period = data["period"]
    if "start_date" in data:
        try:
            budget.start_date = parse_date(data["start_date"])
        except ValueError:
            return error_response("Invalid date format", 400)
    if "end_date" in data:
        try:
            budget.end_date = parse_date(data["end_date"]) if data["end_date"] else None
        except ValueError:
            return error_response("Invalid date format", 400)

    db.session.commit()
    return success_response(_budget_with_spending(budget, user.id), "Budget updated")


@budgets_bp.route("/<int:budget_id>", methods=["DELETE"])
@jwt_required()
def delete_budget(budget_id):
    user = get_current_user()
    if not user:
        return error_response("User not found", 404)

    budget = Budget.query.filter_by(id=budget_id, user_id=user.id).first()
    if not budget:
        return error_response("Budget not found", 404)

    db.session.delete(budget)
    db.session.commit()
    return success_response(message="Budget deleted")


@budgets_bp.route("/summary", methods=["GET"])
@jwt_required()
def budget_summary():
    user = get_current_user()
    if not user:
        return error_response("User not found", 404)

    budgets = Budget.query.filter_by(user_id=user.id).all()
    data = [_budget_with_spending(b, user.id) for b in budgets]

    on_track = sum(1 for b in data if b["status"] == "on_track")
    at_risk = sum(1 for b in data if b["status"] == "at_risk")
    over = sum(1 for b in data if b["status"] == "over")

    return success_response({
        "total_categories": len(data),
        "on_track": on_track,
        "at_risk": at_risk,
        "over_budget": over,
        "budgets": data,
    })
