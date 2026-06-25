from datetime import datetime, date
from app import db


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    full_name = db.Column(db.String(120))
    date_of_birth = db.Column(db.Date)
    phone = db.Column(db.String(30))
    country = db.Column(db.String(60), default="Thailand")
    preferred_currency = db.Column(db.String(10), default="THB")
    theme = db.Column(db.String(10), default="light")
    date_format = db.Column(db.String(20), default="DD/MM/YYYY")
    timezone = db.Column(db.String(50), default="Asia/Bangkok")
    plan = db.Column(db.String(20), default="free")
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    expenses = db.relationship("Expense", backref="user", lazy="dynamic", cascade="all, delete-orphan")
    income_entries = db.relationship("Income", backref="user", lazy="dynamic", cascade="all, delete-orphan")
    budgets = db.relationship("Budget", backref="user", lazy="dynamic", cascade="all, delete-orphan")
    expense_categories = db.relationship("ExpenseCategory", backref="user", lazy="dynamic", cascade="all, delete-orphan")
    income_sources = db.relationship("IncomeSource", backref="user", lazy="dynamic", cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": self.id,
            "username": self.username,
            "email": self.email,
            "full_name": self.full_name,
            "date_of_birth": self.date_of_birth.isoformat() if self.date_of_birth else None,
            "phone": self.phone,
            "country": self.country,
            "preferred_currency": self.preferred_currency,
            "theme": self.theme,
            "date_format": self.date_format,
            "timezone": self.timezone,
            "plan": self.plan,
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class ExpenseCategory(db.Model):
    __tablename__ = "expense_categories"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    name = db.Column(db.String(80), nullable=False)
    color = db.Column(db.String(20), default="#6366f1")
    icon = db.Column(db.String(50), default="tag")
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    expenses = db.relationship("Expense", backref="category", lazy="dynamic")

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "color": self.color,
            "icon": self.icon,
        }


class Expense(db.Model):
    __tablename__ = "expenses"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    category_id = db.Column(db.Integer, db.ForeignKey("expense_categories.id"), nullable=True)
    description = db.Column(db.String(200), nullable=False)
    merchant = db.Column(db.String(100))
    amount = db.Column(db.Numeric(15, 2), nullable=False)
    currency = db.Column(db.String(10), default="THB")
    payment_method = db.Column(db.String(50), default="Cash")
    date = db.Column(db.Date, nullable=False)
    notes = db.Column(db.Text)
    is_recurring = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "category_id": self.category_id,
            "category_name": self.category.name if self.category else None,
            "category_color": self.category.color if self.category else "#6366f1",
            "description": self.description,
            "merchant": self.merchant,
            "amount": float(self.amount),
            "currency": self.currency,
            "payment_method": self.payment_method,
            "date": self.date.isoformat() if self.date else None,
            "notes": self.notes,
            "is_recurring": self.is_recurring,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class IncomeSource(db.Model):
    __tablename__ = "income_sources"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    name = db.Column(db.String(80), nullable=False)
    type = db.Column(db.String(50), default="Other")
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    income_entries = db.relationship("Income", backref="source", lazy="dynamic")

    def to_dict(self):
        return {"id": self.id, "name": self.name, "type": self.type}


class Income(db.Model):
    __tablename__ = "income"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    source_id = db.Column(db.Integer, db.ForeignKey("income_sources.id"), nullable=True)
    description = db.Column(db.String(200), nullable=False)
    amount = db.Column(db.Numeric(15, 2), nullable=False)
    currency = db.Column(db.String(10), default="THB")
    type = db.Column(db.String(30), default="one-time")
    is_recurring = db.Column(db.Boolean, default=False)
    date = db.Column(db.Date, nullable=False)
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "source_id": self.source_id,
            "source_name": self.source.name if self.source else None,
            "source_type": self.source.type if self.source else None,
            "description": self.description,
            "amount": float(self.amount),
            "currency": self.currency,
            "type": self.type,
            "is_recurring": self.is_recurring,
            "date": self.date.isoformat() if self.date else None,
            "notes": self.notes,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class Budget(db.Model):
    __tablename__ = "budgets"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    category_id = db.Column(db.Integer, db.ForeignKey("expense_categories.id"), nullable=True)
    name = db.Column(db.String(100), nullable=False)
    amount = db.Column(db.Numeric(15, 2), nullable=False)
    currency = db.Column(db.String(10), default="THB")
    period = db.Column(db.String(20), default="monthly")
    start_date = db.Column(db.Date, nullable=False)
    end_date = db.Column(db.Date)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    category = db.relationship("ExpenseCategory", backref="budgets")

    def to_dict(self):
        return {
            "id": self.id,
            "category_id": self.category_id,
            "category_name": self.category.name if self.category else None,
            "category_color": self.category.color if self.category else "#6366f1",
            "name": self.name,
            "amount": float(self.amount),
            "currency": self.currency,
            "period": self.period,
            "start_date": self.start_date.isoformat() if self.start_date else None,
            "end_date": self.end_date.isoformat() if self.end_date else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
