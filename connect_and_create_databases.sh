#!/bin/bash
# Connect to Railway PostgreSQL and create databases

export PATH="/opt/homebrew/opt/postgresql@16/bin:$PATH"
PGPASSWORD=wBhiiTjKelhyWOLaxkzsXnClEYKdlJLb psql -h localhost -p 5432 -U postgres -d postgres << 'SQL'
CREATE DATABASE redcube_content;
CREATE DATABASE redcube_users;
CREATE DATABASE redcube_interviews;
CREATE DATABASE redcube_notifications;
\l
\q
SQL
