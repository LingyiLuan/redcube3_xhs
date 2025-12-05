#!/bin/bash
# Railway PostgreSQL Connection and Database Creation Commands

# Step 1: Connect to Railway PostgreSQL
# Replace the password when prompted
psql -h postgres.railway.internal -p 5432 -U postgres -d postgres

# After connecting, you'll see: postgres=#
# Then run these commands one by one:

# CREATE DATABASE redcube_content;
# CREATE DATABASE redcube_users;
# CREATE DATABASE redcube_interviews;
# CREATE DATABASE redcube_notifications;

# Verify databases were created:
# \l

# Exit psql:
# \q
