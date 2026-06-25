from flask import Blueprint, request
from flask_jwt_extended import jwt_required
from sqlalchemy import desc, asc, or_
from app import db
from app.models import Income, IncomeSource
from app.common.utils import success_response, error_response, get_current_user, get_pagination_params, parse_date
from datetime import date

income_bp = Blueprint("income", __name__)


@income_bp.route("/", methods=["GET"])
@jwt_required()
def list_income():
    user = get_current_user()
    if not user:
        return error_response("User not found", 404)

    page, per_page = get_pagination_params()
    query = Income.query.filter_by(user_id=user.id)

    source_id = request.args.get("source_id")
    type_ = request.args.get("type")
    currency = request.args.get("currency")
    date_from = request.args.get("date_from")
    date_to = request.args.get("date_to")
    search = request.args.get("search")
    sort_by = request.args.get("sort_by", "date")
    sort_order = request.args.get("sort_order", "desc")

    if source_id:
        query = query.filter(Income.source_id == source_id)
    if type_:
        query = query.filter(Income.type == type_)
    if currency:
        query = query.filter(Income.currency == currency)
    if date_from:
        try:
            query = query.filter(Income.date >= parse_date(date_from))
        except ValueError:
            pass
    if date_to:
        try:
            query = query.filter(Income.date <= parse_date(date_to))
        except ValueError:
            pass
    if search:
        s = f"%{search}%"
        query = query.filter(Income.description.ilike(s))

    sort_col = getattr(Income, sort_by, Income.date)
    query = query.order_by(desc(sort_col) if sort_order == "desc" else asc(sort_col))

    pagination = query.paginate(page=page, per_page=per_page, error_out=False)
    return success_response(
        [i.to_dict() for i in pagination.items],
        meta={
            "page": pagination.page,
            "per_page": pagination.per_page,
            "total": pagination.total,
            "pages": pagination.pages,
        },
    )


@income_bp.route("/", methods=["POST"])
@jwt_required()
def create_income():
    user = get_current_user()
    if not user:
        return error_response("User not found", 404)

    data = request.get_json() or {}
    if not data.get("description") or not data.get("amount") or not data.get("date"):
        return error_response("description, amount, and date are required", 400)

    try:
        income_date = parse_date(data["date"])
    except ValueError:
        return error_response("Invalid date format", 400)

    income = Income(
        user_id=user.id,
        source_id=data.get("source_id"),
        description=data["description"],
        amount=float(data["amount"]),
        currency=data.get("currency", user.preferred_currency),
        type=data.get("type", "one-time"),
        is_recurring=data.get("is_recurring", False),
        date=income_date,
        notes=data.get("notes"),
    )
    db.session.add(income)
    db.session.commit()
    return success_response(income.to_dict(), "Income added", 201)


@income_bp.route("/<int:income_id>", methods=["GET"])
@jwt_required()
def get_income(income_id):
    user = get_current_user()
    if not user:
        return error_response("User not found", 404)

    income = Income.query.filter_by(id=income_id, user_id=user.id).first()
    if not income:
        return error_response("Income not found", 404)
    return success_response(income.to_dict())


@income_bp.route("/<int:income_id>", methods=["PUT"])
@jwt_required()
def update_income(income_id):
    user = get_current_user()
    if not user:
        return error_response("User not found", 404)

    income = Income.query.filter_by(id=income_id, user_id=user.id).first()
    if not income:
        return error_response("Income not found", 404)

    data = request.get_json() or {}
    if "description" in data:
        income.description = data["description"]
    if "amount" in data:
        income.amount = float(data["amount"])
    if "currency" in data:
        income.currency = data["currency"]
    if "source_id" in data:
        income.source_id = data["source_id"]
    if "type" in data:
        income.type = data["type"]
    if "is_recurring" in data:
        income.is_recurring = data["is_recurring"]
    if "notes" in data:
        income.notes = data["notes"]
    if "date" in data:
        try:
            income.date = parse_date(data["date"])
        except ValueError:
            return error_response("Invalid date format", 400)

    db.session.commit()
    return success_response(income.to_dict(), "Income updated")


@income_bp.route("/<int:income_id>", methods=["DELETE"])
@jwt_required()
def delete_income(income_id):
    user = get_current_user()
    if not user:
        return error_response("User not found", 404)

    income = Income.query.filter_by(id=income_id, user_id=user.id).first()
    if not income:
        return error_response("Income not found", 404)

    db.session.delete(income)
    db.session.commit()
    return success_response(message="Income deleted")


@income_bp.route("/sources", methods=["GET"])
@jwt_required()
def list_sources():
    user = get_current_user()
    if not user:
        return error_response("User not found", 404)

    sources = IncomeSource.query.filter_by(user_id=user.id).all()
    return success_response([s.to_dict() for s in sources])


@income_bp.route("/sources", methods=["POST"])
@jwt_required()
def create_source():
    user = get_current_user()
    if not user:
        return error_response("User not found", 404)

    data = request.get_json() or {}
    if not data.get("name"):
        return error_response("Source name required", 400)

    source = IncomeSource(
        user_id=user.id,
        name=data["name"],
        type=data.get("type", "Other"),
    )
    db.session.add(source)
    db.session.commit()
    return success_response(source.to_dict(), "Source created", 201)


@income_bp.route("/summary", methods=["GET"])
@jwt_required()
def income_summary():
    user = get_current_user()
    if not user:
        return error_response("User not found", 404)

    period = request.args.get("period", "this_month")
    today = date.today()

    if period == "this_month":
        d_from = today.replace(day=1)
        d_to = today
    elif period == "this_year":
        d_from = today.replace(month=1, day=1)
        d_to = today
    else:
        d_from = today.replace(day=1)
        d_to = today

    incomes = Income.query.filter(
        Income.user_id == user.id,
        Income.date >= d_from,
        Income.date <= d_to,
    ).all()

    total = sum(float(i.amount) for i in incomes)
    by_source = {}
    for i in incomes:
        key = i.source.name if i.source else "Other"
        by_source[key] = by_source.get(key, 0) + float(i.amount)

    return success_response({
        "total": total,
        "count": len(incomes),
        "period": period,
        "date_from": d_from.isoformat(),
        "date_to": d_to.isoformat(),
        "by_source": [{"name": k, "amount": v} for k, v in by_source.items()],
    })
