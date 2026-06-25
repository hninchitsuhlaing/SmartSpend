import os
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_jwt_extended import JWTManager
from flask_cors import CORS

db = SQLAlchemy()
migrate = Migrate()
jwt = JWTManager()


def create_app(config_name=None):
    app = Flask(__name__)

    from app.config import config_by_name
    config_name = config_name or os.getenv("FLASK_ENV", "development")
    app.config.from_object(config_by_name[config_name])

    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    CORS(app, resources={r"/api/*": {"origins": app.config["CORS_ORIGINS"]}})

    # Register blueprints
    from app.auth.routes import auth_bp
    from app.expenses.routes import expenses_bp
    from app.income.routes import income_bp
    from app.budgets.routes import budgets_bp
    from app.settings.routes import settings_bp

    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(expenses_bp, url_prefix="/api/expenses")
    app.register_blueprint(income_bp, url_prefix="/api/income")
    app.register_blueprint(budgets_bp, url_prefix="/api/budgets")
    app.register_blueprint(settings_bp, url_prefix="/api/settings")

    @app.route("/")
    def health():
        return {"message": "SmartSpend API running", "status": "ok"}

    return app
