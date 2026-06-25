from flask import Blueprint, request
from flask_jwt_extended import jwt_required
from sqlalchemy import desc, asc, or_
from app import db
from app.models import Expense, ExpenseCategory
from app.common.utils import success_response, error_response, get_current_user, get_pagination_params, parse_date
from datetime import date

expenses_bp = Blueprint("expenses", __name__)


@expenses_bp.route("/", methods=["GET"])
@jwt_required()
def list_expenses():
    user = get_current_user()
    if not user:
        return error_response("User not found", 404)

    page, per_page = get_pagination_params()
    query = Expense.query.filter_by(user_id=user.id)

    category_id = request.args.get("category_id")
    payment_method = request.args.get("payment_method")
    currency = request.args.get("currency")
    date_from = request.args.get("date_from")
    date_to = request.args.get("date_to")
    amount_min = request.args.get("amount_min")
    amount_max = request.args.get("amount_max")
    search = request.args.get("search")
    sort_by = request.args.get("sort_by", "date")
    sort_order = request.args.get("sort_order", "desc")

    if category_id:
        query = query.filter(Expense.category_id == category_id)
    if payment_method:
        query = query.filter(Expense.payment_method == payment_method)
    if currency:
        query = query.filter(Expense.currency == currency)
    if date_from:
        try:
            query = query.filter(Expense.date >= parse_date(date_from))
        except ValueError:
            pass
    if date_to:
        try:
            query = query.filter(Expense.date <= parse_date(date_to))
        except ValueError:
            pass
    if amount_min:
        try:
            query = query.filter(Expense.amount >= float(amount_min))
        except ValueError:
            pass
    if amount_max:
        try:
            query = query.filter(Expense.amount <= float(amount_max))
        except ValueError:
            pass
    if search:
        s = f"%{search}%"
        query = query.filter(or_(Expense.description.ilike(s), Expense.merchant.ilike(s)))

    sort_col = getattr(Expense, sort_by, Expense.date)
    query = query.order_by(desc(sort_col) if sort_order == "desc" else asc(sort_col))

    pagination = query.paginate(page=page, per_page=per_page, error_out=False)
    return success_response(
        [e.to_dict() for e in pagination.items],
        meta={
            "page": pagination.page,
            "per_page": pagination.per_page,
            "total": pagination.total,
            "pages": pagination.pages,
        },
    )


@expenses_bp.route("/", methods=["POST"])
@jwt_required()
def create_expense():
    user = get_current_user()
    if not user:
        return error_response("User not found", 404)

    data = request.get_json() or {}
    if not data.get("description") or not data.get("amount") or not data.get("date"):
        return error_response("description, amount, and date are required", 400)

    try:
        expense_date = parse_date(data["date"])
    except ValueError:
        return error_response("Invalid date format", 400)

    expense = Expense(
        user_id=user.id,
        category_id=data.get("category_id"),
        description=data["description"],
        merchant=data.get("merchant"),
        amount=float(data["amount"]),
        currency=data.get("currency", user.preferred_currency),
        payment_method=data.get("payment_method", "Cash"),
        date=expense_date,
        notes=data.get("notes"),
        is_recurring=data.get("is_recurring", False),
    )
    db.session.add(expense)
    db.session.commit()
    return success_response(expense.to_dict(), "Expense created", 201)


@expenses_bp.route("/<int:expense_id>", methods=["GET"])
@jwt_required()
def get_expense(expense_id):
    user = get_current_user()
    if not user:
        return error_response("User not found", 404)

    expense = Expense.query.filter_by(id=expense_id, user_id=user.id).first()
    if not expense:
        return error_response("Expense not found", 404)
    return success_response(expense.to_dict())


@expenses_bp.route("/<int:expense_id>", methods=["PUT"])
@jwt_required()
def update_expense(expense_id):
    user = get_current_user()
    if not user:
        return error_response("User not found", 404)

    expense = Expense.query.filter_by(id=expense_id, user_id=user.id).first()
    if not expense:
        return error_response("Expense not found", 404)

    data = request.get_json() or {}
    if "description" in data:
        expense.description = data["description"]
    if "merchant" in data:
        expense.merchant = data["merchant"]
    if "amount" in data:
        expense.amount = float(data["amount"])
    if "currency" in data:
        expense.currency = data["currency"]
    if "payment_method" in data:
        expense.payment_method = data["payment_method"]
    if "category_id" in data:
        expense.category_id = data["category_id"]
    if "notes" in data:
        expense.notes = data["notes"]
    if "is_recurring" in data:
        expense.is_recurring = data["is_recurring"]
    if "date" in data:
        try:
            expense.date = parse_date(data["date"])
        except ValueError:
            return error_response("Invalid date format", 400)

    db.session.commit()
    return success_response(expense.to_dict(), "Expense updated")


@expenses_bp.route("/<int:expense_id>", methods=["DELETE"])
@jwt_required()
def delete_expense(expense_id):
    user = get_current_user()
    if not user:
        return error_response("User not found", 404)

    expense = Expense.query.filter_by(id=expense_id, user_id=user.id).first()
    if not expense:
        return error_response("Expense not found", 404)

    db.session.delete(expense)
    db.session.commit()
    return success_response(message="Expense deleted")


@expenses_bp.route("/categories", methods=["GET"])
@jwt_required()
def list_categories():
    user = get_current_user()
    if not user:
        return error_response("User not found", 404)

    cats = ExpenseCategory.query.filter_by(user_id=user.id).all()
    return success_response([c.to_dict() for c in cats])


@expenses_bp.route("/categories", methods=["POST"])
@jwt_required()
def create_category():
    user = get_current_user()
    if not user:
        return error_response("User not found", 404)

    data = request.get_json() or {}
    if not data.get("name"):
        return error_response("Category name required", 400)

    cat = ExpenseCategory(
        user_id=user.id,
        name=data["name"],
        color=data.get("color", "#6366f1"),
        icon=data.get("icon", "tag"),
    )
    db.session.add(cat)
    db.session.commit()
    return success_response(cat.to_dict(), "Category created", 201)


@expenses_bp.route("/summary", methods=["GET"])
@jwt_required()
def expense_summary():
    user = get_current_user()
    if not user:
        return error_response("User not found", 404)

    from datetime import datetime
    from sqlalchemy import func

    period = request.args.get("period", "this_month")
    today = date.today()

    if period == "this_month":
        d_from = today.replace(day=1)
        d_to = today
    elif period == "last_month":
        first_this = today.replace(day=1)
        last_month_end = first_this.replace(day=1) - __import__("datetime").timedelta(days=1)
        d_from = last_month_end.replace(day=1)
        d_to = last_month_end
    elif period == "this_year":
        d_from = today.replace(month=1, day=1)
        d_to = today
    else:
        d_from = today.replace(day=1)
        d_to = today

    expenses = Expense.query.filter(
        Expense.user_id == user.id,
        Expense.date >= d_from,
        Expense.date <= d_to,
    ).all()


    total = sum(float(e.amount) for e in expenses)
    by_category = {}
    for e in expenses:
        key = e.category.name if e.category else "Uncategorized"
        by_category[key] = by_category.get(key, 0) + float(e.amount)

    return success_response({
        "total": total,
        "count": len(expenses),
        "period": period,
        "date_from": d_from.isoformat(),
        "date_to": d_to.isoformat(),
        "by_category": [{"name": k, "amount": v} for k, v in by_category.items()],
    })


@expenses_bp.route("/payment-methods", methods=["GET"])
@jwt_required()
def payment_methods():
    return success_response(["Cash", "Visa", "Mastercard", "Bank Transfer", "PayPal", "Apple Pay", "Google Pay", "Other"])
