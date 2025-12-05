#!/bin/bash
# Add PostgreSQL to PATH and connect to Railway PostgreSQL
export PATH="/opt/homebrew/opt/postgresql@16/bin:$PATH"
railway connect postgres
