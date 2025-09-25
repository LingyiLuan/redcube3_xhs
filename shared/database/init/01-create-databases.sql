-- Create databases for each microservice
CREATE DATABASE redcube_users;
CREATE DATABASE redcube_interviews;
CREATE DATABASE redcube_content;
CREATE DATABASE redcube_notifications;

-- Grant privileges to postgres user for all databases
GRANT ALL PRIVILEGES ON DATABASE redcube_users TO postgres;
GRANT ALL PRIVILEGES ON DATABASE redcube_interviews TO postgres;
GRANT ALL PRIVILEGES ON DATABASE redcube_content TO postgres;
GRANT ALL PRIVILEGES ON DATABASE redcube_notifications TO postgres;