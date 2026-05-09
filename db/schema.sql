-- Project Assignment System — Schema
-- Run this first

CREATE DATABASE IF NOT EXISTS project_assignment_db;
USE project_assignment_db;

CREATE TABLE users (
    user_id        INT PRIMARY KEY AUTO_INCREMENT,
    name           VARCHAR(100) NOT NULL,
    email          VARCHAR(100) UNIQUE NOT NULL,
    password_hash  VARCHAR(255) NOT NULL,
    role           ENUM('admin', 'user') DEFAULT 'user',
    specialisation VARCHAR(100)
);

CREATE TABLE projects (
    project_id              INT PRIMARY KEY AUTO_INCREMENT,
    title                   VARCHAR(150) NOT NULL,
    description             TEXT,
    required_specialisation VARCHAR(100) NOT NULL,
    status                  ENUM('open','ongoing','completed') DEFAULT 'open',
    admin_id                INT NOT NULL,
    FOREIGN KEY (admin_id) REFERENCES users(user_id)
);

CREATE TABLE assignments (
    assignment_id  INT PRIMARY KEY AUTO_INCREMENT,
    project_id     INT NOT NULL,
    user_id        INT NOT NULL,
    assigned_at    DATETIME DEFAULT NOW(),
    UNIQUE(project_id, user_id),
    FOREIGN KEY (project_id) REFERENCES projects(project_id),
    FOREIGN KEY (user_id)    REFERENCES users(user_id)
);

CREATE TABLE tasks (
    task_id      INT PRIMARY KEY AUTO_INCREMENT,
    project_id   INT NOT NULL,
    assigned_to  INT NOT NULL,
    title        VARCHAR(150) NOT NULL,
    description  TEXT,
    status       ENUM('pending','submitted','scored') DEFAULT 'pending',
    FOREIGN KEY (project_id)  REFERENCES projects(project_id),
    FOREIGN KEY (assigned_to) REFERENCES users(user_id)
);

CREATE TABLE submissions (
    submission_id  INT PRIMARY KEY AUTO_INCREMENT,
    task_id        INT NOT NULL,
    user_id        INT NOT NULL,
    content        TEXT NOT NULL,
    score          INT CHECK (score BETWEEN 0 AND 100),
    submitted_at   DATETIME DEFAULT NOW(),
    FOREIGN KEY (task_id)  REFERENCES tasks(task_id),
    FOREIGN KEY (user_id)  REFERENCES users(user_id)
);
