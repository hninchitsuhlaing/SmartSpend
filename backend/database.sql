-- SmartSpend Database Schema
-- Run this in MySQL/phpMyAdmin via XAMPP

--CREATE DATABASE IF NOT EXISTS smartspend_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
--USE smartspend_db;

CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(80) NOT NULL UNIQUE,
    email VARCHAR(120) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(120),
    date_of_birth DATE,
    phone VARCHAR(30),
    country VARCHAR(60) DEFAULT 'Thailand',
    preferred_currency VARCHAR(10) DEFAULT 'THB',
    theme VARCHAR(10) DEFAULT 'light',
    date_format VARCHAR(20) DEFAULT 'DD/MM/YYYY',
    timezone VARCHAR(50) DEFAULT 'Asia/Bangkok',
    plan VARCHAR(20) DEFAULT 'free',
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE expense_categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    name VARCHAR(80) NOT NULL,
    color VARCHAR(20) DEFAULT '#6366f1',
    icon VARCHAR(50) DEFAULT 'tag',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE expenses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    category_id INT,
    description VARCHAR(200) NOT NULL,
    merchant VARCHAR(100),
    amount DECIMAL(15,2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'THB',
    payment_method VARCHAR(50) DEFAULT 'Cash',
    date DATE NOT NULL,
    notes TEXT,
    is_recurring TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES expense_categories(id) ON DELETE SET NULL
);

CREATE TABLE income_sources (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    name VARCHAR(80) NOT NULL,
    type VARCHAR(50) DEFAULT 'Other',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE income (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    source_id INT,
    description VARCHAR(200) NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'THB',
    type VARCHAR(30) DEFAULT 'one-time',
    is_recurring TINYINT(1) DEFAULT 0,
    date DATE NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (source_id) REFERENCES income_sources(id) ON DELETE SET NULL
);

CREATE TABLE budgets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    category_id INT,
    name VARCHAR(100) NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'THB',
    period VARCHAR(20) DEFAULT 'monthly',
    start_date DATE NOT NULL,
    end_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES expense_categories(id) ON DELETE SET NULL
);

-- Default expense categories seeded per user on registration (done in code)
