import os
from app import create_app, db
from app.models import User, Expense, Income, Budget, ExpenseCategory, IncomeSource

app = create_app(os.getenv("FLASK_ENV", "development"))


@app.shell_context_processor
def make_shell_context():
    return {
        "db": db,
        "User": User,
        "Expense": Expense,
        "Income": Income,
        "Budget": Budget,
        "ExpenseCategory": ExpenseCategory,
        "IncomeSource": IncomeSource,
    }


@app.cli.command("init-db")
def init_db():
    """Create all database tables."""
    db.create_all()
    print("Database tables created.")


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.getenv("PORT", 5000)), debug=app.config["DEBUG"])
