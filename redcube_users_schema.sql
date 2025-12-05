--
-- PostgreSQL database dump
--

\restrict mMJOyev8GFSf0wMoO7On5e9kuazcL71FLYd5MwkpsqCYvgjZUe1jBQIAJLNmsS0

-- Dumped from database version 16.9 (Debian 16.9-1.pgdg110+1)
-- Dumped by pg_dump version 16.11 (Homebrew)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: dblink; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS dblink WITH SCHEMA public;


--
-- Name: EXTENSION dblink; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION dblink IS 'connect to other PostgreSQL databases from within a database';


--
-- Name: manual_sync_user(integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.manual_sync_user(user_id_param integer) RETURNS text
    LANGUAGE plpgsql
    AS $$
DECLARE
  result TEXT;
BEGIN
  -- Get user from redcube_users and sync to postgres
  PERFORM dblink_exec(
    'dbname=postgres user=postgres password=postgres',
    format(
      'INSERT INTO users (id, email, created_at, updated_at, email_verified)
       SELECT id, email, created_at, NOW(), COALESCE(email_verified, false)
       FROM dblink(''dbname=redcube_users user=postgres password=postgres'',
                   ''SELECT id, email, created_at, email_verified FROM users WHERE id = %L'')
       AS source(id int, email varchar, created_at timestamp, email_verified boolean)
       ON CONFLICT (id) DO UPDATE
       SET email = EXCLUDED.email,
           updated_at = EXCLUDED.updated_at,
           email_verified = EXCLUDED.email_verified',
      user_id_param
    )
  );

  result := format('✅ User %s manually synced to postgres', user_id_param);
  RAISE NOTICE '%', result;
  RETURN result;

EXCEPTION WHEN OTHERS THEN
  result := format('❌ Manual sync failed for user %s: %s', user_id_param, SQLERRM);
  RAISE WARNING '%', result;
  RETURN result;
END;
$$;


--
-- Name: FUNCTION manual_sync_user(user_id_param integer); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.manual_sync_user(user_id_param integer) IS 'Manually sync a specific user from redcube_users to postgres. Useful for fixing failed syncs without restarting services.';


--
-- Name: sync_subscription_to_user(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.sync_subscription_to_user() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  UPDATE users
  SET
    subscription_tier = NEW.tier,
    subscription_status = NEW.status,
    subscription_period_start = NEW.current_period_start,
    subscription_period_end = NEW.current_period_end,
    updated_at = NOW()
  WHERE id = NEW.user_id;

  RETURN NEW;
END;
$$;


--
-- Name: sync_user_to_postgres(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.sync_user_to_postgres() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  -- Use dblink to sync user to postgres database
  -- This runs in the same transaction as user creation
  BEGIN
    PERFORM dblink_exec(
      'dbname=postgres user=postgres password=postgres',
      format(
        'INSERT INTO users (id, email, created_at, updated_at, email_verified)
         VALUES (%L, %L, %L, %L, %L)
         ON CONFLICT (id) DO UPDATE
         SET email = EXCLUDED.email,
             updated_at = EXCLUDED.updated_at,
             email_verified = EXCLUDED.email_verified',
        NEW.id,
        NEW.email,
        COALESCE(NEW.created_at, NOW()),
        NOW(),
        COALESCE(NEW.email_verified, false)
      )
    );

    RAISE NOTICE 'User % synced to postgres successfully', NEW.id;

  EXCEPTION WHEN OTHERS THEN
    -- Log error but don't fail user creation
    -- This ensures auth service continues working even if sync fails
    RAISE WARNING 'User sync to postgres failed for user %: %', NEW.id, SQLERRM;
    RAISE NOTICE 'User % created in redcube_users but sync failed (non-critical)', NEW.id;
  END;

  RETURN NEW;
END;
$$;


--
-- Name: FUNCTION sync_user_to_postgres(); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.sync_user_to_postgres() IS 'Auto-syncs users from redcube_users to postgres database. Pattern: Database trigger for real-time sync. Upgrade to CDC/Kafka when scaling beyond 100K users.';


--
-- Name: update_subscription_timestamp(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_subscription_timestamp() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


--
-- Name: update_usage_tracking_timestamp(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_usage_tracking_timestamp() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


--
-- Name: update_user_subscription(integer, character varying, character varying, character varying, timestamp without time zone, timestamp without time zone); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_user_subscription(p_user_id integer, p_stripe_subscription_id character varying, p_tier character varying, p_status character varying, p_period_start timestamp without time zone, p_period_end timestamp without time zone) RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
  UPDATE users
  SET
    stripe_subscription_id = p_stripe_subscription_id,
    subscription_tier = p_tier,
    subscription_status = p_status,
    subscription_period_start = p_period_start,
    subscription_period_end = p_period_end,
    updated_at = NOW()
  WHERE id = p_user_id;

  RAISE NOTICE 'Updated user % subscription to % (%)', p_user_id, p_tier, p_status;
END;
$$;


--
-- Name: FUNCTION update_user_subscription(p_user_id integer, p_stripe_subscription_id character varying, p_tier character varying, p_status character varying, p_period_start timestamp without time zone, p_period_end timestamp without time zone); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.update_user_subscription(p_user_id integer, p_stripe_subscription_id character varying, p_tier character varying, p_status character varying, p_period_start timestamp without time zone, p_period_end timestamp without time zone) IS 'Update user subscription status from Stripe webhook';


--
-- Name: user_has_feature(integer, character varying); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.user_has_feature(p_user_id integer, p_feature_name character varying) RETURNS boolean
    LANGUAGE plpgsql
    AS $$
DECLARE
  v_tier VARCHAR;
  v_has_access BOOLEAN;
BEGIN
  -- Get user's tier
  SELECT subscription_tier INTO v_tier
  FROM users
  WHERE id = p_user_id;

  -- Check feature access based on tier
  CASE p_feature_name
    WHEN 'api_access' THEN
      SELECT api_access INTO v_has_access
      FROM usage_limits
      WHERE tier = v_tier;
    WHEN 'priority_support' THEN
      SELECT priority_support INTO v_has_access
      FROM usage_limits
      WHERE tier = v_tier;
    WHEN 'data_export' THEN
      SELECT data_export INTO v_has_access
      FROM usage_limits
      WHERE tier = v_tier;
    ELSE
      v_has_access := false;
  END CASE;

  RETURN COALESCE(v_has_access, false);
END;
$$;


--
-- Name: FUNCTION user_has_feature(p_user_id integer, p_feature_name character varying); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.user_has_feature(p_user_id integer, p_feature_name character varying) IS 'Check if user has access to a specific feature';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: email_verification_tokens; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.email_verification_tokens (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id integer NOT NULL,
    token character varying(255) NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: TABLE email_verification_tokens; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.email_verification_tokens IS 'Stores secure tokens for email verification with 24-hour expiration';


--
-- Name: COLUMN email_verification_tokens.token; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.email_verification_tokens.token IS 'Hashed verification token (generated using crypto.randomBytes)';


--
-- Name: COLUMN email_verification_tokens.expires_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.email_verification_tokens.expires_at IS 'Token expiration timestamp (24 hours from creation)';


--
-- Name: lemon_squeezy_events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.lemon_squeezy_events (
    id integer NOT NULL,
    event_id character varying(255) NOT NULL,
    event_type character varying(100) NOT NULL,
    event_data jsonb NOT NULL,
    processed boolean DEFAULT false,
    retry_count integer DEFAULT 0,
    error_message text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    processed_at timestamp without time zone
);


--
-- Name: lemon_squeezy_events_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.lemon_squeezy_events_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: lemon_squeezy_events_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.lemon_squeezy_events_id_seq OWNED BY public.lemon_squeezy_events.id;


--
-- Name: password_reset_attempts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.password_reset_attempts (
    id integer NOT NULL,
    email character varying(255) NOT NULL,
    ip_address character varying(45),
    attempted_at timestamp without time zone DEFAULT now(),
    success boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: password_reset_attempts_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.password_reset_attempts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: password_reset_attempts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.password_reset_attempts_id_seq OWNED BY public.password_reset_attempts.id;


--
-- Name: payment_transactions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.payment_transactions (
    id integer NOT NULL,
    user_id integer NOT NULL,
    subscription_id integer,
    stripe_payment_intent_id character varying(255),
    stripe_invoice_id character varying(255),
    stripe_charge_id character varying(255),
    amount_cents integer NOT NULL,
    currency character varying(3) DEFAULT 'usd'::character varying,
    status character varying(50) NOT NULL,
    payment_method_type character varying(50),
    payment_method_last4 character varying(4),
    payment_method_brand character varying(50),
    paid_at timestamp without time zone,
    refunded_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    description text,
    failure_reason text,
    CONSTRAINT valid_transaction_status CHECK (((status)::text = ANY ((ARRAY['succeeded'::character varying, 'pending'::character varying, 'failed'::character varying, 'refunded'::character varying, 'canceled'::character varying])::text[])))
);


--
-- Name: TABLE payment_transactions; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.payment_transactions IS 'All payment transactions (successful and failed)';


--
-- Name: COLUMN payment_transactions.amount_cents; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.payment_transactions.amount_cents IS 'Transaction amount in cents';


--
-- Name: payment_transactions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.payment_transactions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: payment_transactions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.payment_transactions_id_seq OWNED BY public.payment_transactions.id;


--
-- Name: stripe_events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.stripe_events (
    id integer NOT NULL,
    stripe_event_id character varying(255) NOT NULL,
    event_type character varying(100) NOT NULL,
    api_version character varying(50),
    data jsonb NOT NULL,
    processed boolean DEFAULT false,
    processed_at timestamp without time zone,
    error_message text,
    retry_count integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT now(),
    CONSTRAINT max_retries CHECK ((retry_count <= 10))
);


--
-- Name: TABLE stripe_events; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.stripe_events IS 'Stripe webhook events for idempotency and debugging';


--
-- Name: COLUMN stripe_events.processed; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.stripe_events.processed IS 'Whether event has been successfully processed';


--
-- Name: stripe_events_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.stripe_events_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: stripe_events_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.stripe_events_id_seq OWNED BY public.stripe_events.id;


--
-- Name: subscriptions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.subscriptions (
    id integer NOT NULL,
    user_id integer NOT NULL,
    stripe_subscription_id character varying(255),
    stripe_customer_id character varying(255),
    stripe_price_id character varying(255),
    tier character varying(50) NOT NULL,
    billing_interval character varying(20),
    status character varying(50) NOT NULL,
    amount_cents integer,
    currency character varying(3) DEFAULT 'usd'::character varying,
    current_period_start timestamp without time zone,
    current_period_end timestamp without time zone,
    trial_start timestamp without time zone,
    trial_end timestamp without time zone,
    canceled_at timestamp without time zone,
    ended_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    ls_subscription_id character varying(255),
    ls_customer_id character varying(255),
    ls_variant_id character varying(255),
    cancel_at_period_end boolean DEFAULT false,
    CONSTRAINT valid_interval CHECK (((billing_interval)::text = ANY ((ARRAY['month'::character varying, 'year'::character varying])::text[]))),
    CONSTRAINT valid_status CHECK (((status)::text = ANY ((ARRAY['active'::character varying, 'cancelled'::character varying, 'expired'::character varying, 'past_due'::character varying, 'paused'::character varying, 'on_trial'::character varying, 'unpaid'::character varying])::text[]))),
    CONSTRAINT valid_tier CHECK (((tier)::text = ANY ((ARRAY['free'::character varying, 'pro'::character varying, 'premium'::character varying])::text[])))
);


--
-- Name: TABLE subscriptions; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.subscriptions IS 'Stripe subscription history and current state';


--
-- Name: COLUMN subscriptions.amount_cents; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.subscriptions.amount_cents IS 'Subscription price in cents (900 = $9.00)';


--
-- Name: COLUMN subscriptions.ls_subscription_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.subscriptions.ls_subscription_id IS 'Lemon Squeezy subscription ID';


--
-- Name: COLUMN subscriptions.ls_customer_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.subscriptions.ls_customer_id IS 'Lemon Squeezy customer ID';


--
-- Name: COLUMN subscriptions.ls_variant_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.subscriptions.ls_variant_id IS 'Lemon Squeezy variant ID (product variant)';


--
-- Name: COLUMN subscriptions.cancel_at_period_end; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.subscriptions.cancel_at_period_end IS 'Whether subscription will cancel at end of current period';


--
-- Name: subscriptions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.subscriptions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: subscriptions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.subscriptions_id_seq OWNED BY public.subscriptions.id;


--
-- Name: usage_limits; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.usage_limits (
    id integer NOT NULL,
    tier character varying(50) NOT NULL,
    analyses_per_month integer NOT NULL,
    learning_maps_per_month integer NOT NULL,
    batch_analyses_per_month integer DEFAULT 0,
    api_access boolean DEFAULT false,
    priority_support boolean DEFAULT false,
    data_export boolean DEFAULT false,
    custom_branding boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    CONSTRAINT valid_tier_limits CHECK (((tier)::text = ANY ((ARRAY['free'::character varying, 'pro'::character varying, 'premium'::character varying, 'enterprise'::character varying])::text[])))
);


--
-- Name: TABLE usage_limits; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.usage_limits IS 'Tier-based feature limits and permissions';


--
-- Name: COLUMN usage_limits.analyses_per_month; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.usage_limits.analyses_per_month IS '-1 means unlimited';


--
-- Name: usage_limits_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.usage_limits_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: usage_limits_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.usage_limits_id_seq OWNED BY public.usage_limits.id;


--
-- Name: usage_tracking; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.usage_tracking (
    id integer NOT NULL,
    user_id integer NOT NULL,
    resource_type character varying(50) NOT NULL,
    usage_count integer DEFAULT 0 NOT NULL,
    period_start timestamp without time zone NOT NULL,
    period_end timestamp without time zone NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: TABLE usage_tracking; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.usage_tracking IS 'Tracks resource usage per user per billing period';


--
-- Name: COLUMN usage_tracking.resource_type; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.usage_tracking.resource_type IS 'Type of resource: analyses, learning_maps';


--
-- Name: COLUMN usage_tracking.usage_count; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.usage_tracking.usage_count IS 'Number of times resource was used in this period';


--
-- Name: COLUMN usage_tracking.period_start; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.usage_tracking.period_start IS 'Start of billing period (usually first day of month)';


--
-- Name: COLUMN usage_tracking.period_end; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.usage_tracking.period_end IS 'End of billing period (usually first day of next month)';


--
-- Name: usage_tracking_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.usage_tracking_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: usage_tracking_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.usage_tracking_id_seq OWNED BY public.usage_tracking.id;


--
-- Name: user_preferences; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_preferences (
    id integer NOT NULL,
    user_id integer,
    theme character varying(20) DEFAULT 'light'::character varying,
    language character varying(10) DEFAULT 'en'::character varying,
    notification_settings jsonb DEFAULT '{}'::jsonb,
    dashboard_layout jsonb DEFAULT '{}'::jsonb,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    email_notifications boolean DEFAULT true,
    weekly_digest boolean DEFAULT true
);


--
-- Name: user_preferences_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.user_preferences_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: user_preferences_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.user_preferences_id_seq OWNED BY public.user_preferences.id;


--
-- Name: user_profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_profiles (
    id integer NOT NULL,
    user_id integer,
    bio text,
    skills text[],
    experience_level character varying(50),
    resume_url character varying(500),
    linkedin_url character varying(500),
    github_url character varying(500),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: user_profiles_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.user_profiles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: user_profiles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.user_profiles_id_seq OWNED BY public.user_profiles.id;


--
-- Name: user_sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_sessions (
    id integer NOT NULL,
    user_id integer,
    session_token character varying(255) NOT NULL,
    expires_at timestamp without time zone NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    ip_address inet,
    user_agent text
);


--
-- Name: user_sessions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.user_sessions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: user_sessions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.user_sessions_id_seq OWNED BY public.user_sessions.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id integer NOT NULL,
    email character varying(255) NOT NULL,
    password_hash character varying(255),
    first_name character varying(100),
    last_name character varying(100),
    role character varying(50) DEFAULT 'candidate'::character varying,
    status character varying(50) DEFAULT 'active'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    google_id character varying(255),
    display_name character varying(255),
    avatar_url character varying(500),
    last_login timestamp without time zone,
    is_active boolean DEFAULT true,
    linkedin_url character varying(500),
    email_verified boolean DEFAULT false,
    verification_token character varying(255),
    verification_token_expires timestamp without time zone,
    password_reset_token character varying(255),
    password_reset_expires timestamp without time zone,
    reset_token character varying(255),
    reset_token_expires timestamp without time zone,
    recovery_email character varying(255),
    stripe_customer_id character varying(255),
    stripe_subscription_id character varying(255),
    subscription_tier character varying(50) DEFAULT 'free'::character varying,
    subscription_status character varying(50) DEFAULT 'inactive'::character varying,
    subscription_period_start timestamp without time zone,
    subscription_period_end timestamp without time zone,
    trial_ends_at timestamp without time zone
);


--
-- Name: COLUMN users.password_hash; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.users.password_hash IS 'bcrypt hash of user password (nullable for OAuth-only users)';


--
-- Name: COLUMN users.linkedin_url; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.users.linkedin_url IS 'User LinkedIn profile URL (for OAuth and profile display)';


--
-- Name: COLUMN users.email_verified; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.users.email_verified IS 'Whether the user email has been verified (auto-true for OAuth users)';


--
-- Name: COLUMN users.verification_token; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.users.verification_token IS 'Token for email verification (used during registration)';


--
-- Name: COLUMN users.verification_token_expires; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.users.verification_token_expires IS 'Expiration timestamp for verification token';


--
-- Name: COLUMN users.password_reset_token; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.users.password_reset_token IS 'Token for password reset flow';


--
-- Name: COLUMN users.password_reset_expires; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.users.password_reset_expires IS 'Expiration timestamp for password reset token';


--
-- Name: COLUMN users.stripe_customer_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.users.stripe_customer_id IS 'Stripe customer ID (cus_xxxxx)';


--
-- Name: COLUMN users.stripe_subscription_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.users.stripe_subscription_id IS 'Stripe subscription ID (sub_xxxxx)';


--
-- Name: COLUMN users.subscription_tier; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.users.subscription_tier IS 'free, pro, or premium';


--
-- Name: COLUMN users.subscription_status; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.users.subscription_status IS 'active, canceled, past_due, trialing, inactive';


--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: v_active_subscriptions; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_active_subscriptions AS
 SELECT u.id AS user_id,
    u.email,
    u.display_name,
    s.stripe_subscription_id,
    s.tier,
    s.billing_interval,
    s.amount_cents,
    s.status,
    s.current_period_start,
    s.current_period_end,
    s.trial_end,
        CASE
            WHEN (s.current_period_end < now()) THEN 'expired'::character varying
            WHEN ((s.trial_end IS NOT NULL) AND (s.trial_end > now())) THEN 'trialing'::character varying
            ELSE s.status
        END AS effective_status,
    EXTRACT(day FROM ((s.current_period_end)::timestamp with time zone - now())) AS days_until_renewal
   FROM (public.users u
     JOIN public.subscriptions s ON ((u.id = s.user_id)))
  WHERE ((s.status)::text = ANY ((ARRAY['active'::character varying, 'trialing'::character varying, 'past_due'::character varying])::text[]))
  ORDER BY s.current_period_end;


--
-- Name: VIEW v_active_subscriptions; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON VIEW public.v_active_subscriptions IS 'All currently active subscriptions with renewal dates';


--
-- Name: v_monthly_recurring_revenue; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_monthly_recurring_revenue AS
 SELECT count(DISTINCT user_id) AS total_paying_users,
    tier,
    billing_interval,
    count(*) AS subscription_count,
    ((sum(amount_cents))::numeric / 100.0) AS total_amount_dollars,
    (sum(
        CASE
            WHEN ((billing_interval)::text = 'month'::text) THEN (amount_cents)::numeric
            WHEN ((billing_interval)::text = 'year'::text) THEN ((amount_cents)::numeric / 12.0)
            ELSE (0)::numeric
        END) / 100.0) AS mrr_dollars
   FROM public.subscriptions
  WHERE ((status)::text = ANY ((ARRAY['active'::character varying, 'trialing'::character varying])::text[]))
  GROUP BY tier, billing_interval
  ORDER BY tier, billing_interval;


--
-- Name: VIEW v_monthly_recurring_revenue; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON VIEW public.v_monthly_recurring_revenue IS 'MRR breakdown by tier and billing interval';


--
-- Name: v_user_sync_missing; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_user_sync_missing AS
 SELECT id,
    email,
    created_at,
    'Missing in postgres'::text AS sync_status
   FROM public.dblink('dbname=redcube_users user=postgres password=postgres'::text, 'SELECT id, email, created_at FROM users'::text) source(id integer, email character varying, created_at timestamp without time zone)
  WHERE (NOT (id IN ( SELECT users.id
           FROM public.users)));


--
-- Name: VIEW v_user_sync_missing; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON VIEW public.v_user_sync_missing IS 'Shows users that exist in redcube_users but not in postgres. Should be empty if sync is working correctly.';


--
-- Name: v_user_sync_status; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_user_sync_status AS
 SELECT 'redcube_users'::text AS source_database,
    count(*) AS user_count,
    max(source_users.created_at) AS last_user_created
   FROM public.dblink('dbname=redcube_users user=postgres password=postgres'::text, 'SELECT id, created_at FROM users'::text) source_users(id integer, created_at timestamp without time zone)
UNION ALL
 SELECT 'postgres'::text AS source_database,
    count(*) AS user_count,
    max(users.created_at) AS last_user_created
   FROM public.users;


--
-- Name: VIEW v_user_sync_status; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON VIEW public.v_user_sync_status IS 'Shows user count in both databases to verify sync health. Counts should be equal or nearly equal.';


--
-- Name: lemon_squeezy_events id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lemon_squeezy_events ALTER COLUMN id SET DEFAULT nextval('public.lemon_squeezy_events_id_seq'::regclass);


--
-- Name: password_reset_attempts id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.password_reset_attempts ALTER COLUMN id SET DEFAULT nextval('public.password_reset_attempts_id_seq'::regclass);


--
-- Name: payment_transactions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_transactions ALTER COLUMN id SET DEFAULT nextval('public.payment_transactions_id_seq'::regclass);


--
-- Name: stripe_events id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stripe_events ALTER COLUMN id SET DEFAULT nextval('public.stripe_events_id_seq'::regclass);


--
-- Name: subscriptions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscriptions ALTER COLUMN id SET DEFAULT nextval('public.subscriptions_id_seq'::regclass);


--
-- Name: usage_limits id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usage_limits ALTER COLUMN id SET DEFAULT nextval('public.usage_limits_id_seq'::regclass);


--
-- Name: usage_tracking id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usage_tracking ALTER COLUMN id SET DEFAULT nextval('public.usage_tracking_id_seq'::regclass);


--
-- Name: user_preferences id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_preferences ALTER COLUMN id SET DEFAULT nextval('public.user_preferences_id_seq'::regclass);


--
-- Name: user_profiles id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_profiles ALTER COLUMN id SET DEFAULT nextval('public.user_profiles_id_seq'::regclass);


--
-- Name: user_sessions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_sessions ALTER COLUMN id SET DEFAULT nextval('public.user_sessions_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Name: email_verification_tokens email_verification_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_verification_tokens
    ADD CONSTRAINT email_verification_tokens_pkey PRIMARY KEY (id);


--
-- Name: email_verification_tokens email_verification_tokens_token_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_verification_tokens
    ADD CONSTRAINT email_verification_tokens_token_key UNIQUE (token);


--
-- Name: lemon_squeezy_events lemon_squeezy_events_event_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lemon_squeezy_events
    ADD CONSTRAINT lemon_squeezy_events_event_id_key UNIQUE (event_id);


--
-- Name: lemon_squeezy_events lemon_squeezy_events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lemon_squeezy_events
    ADD CONSTRAINT lemon_squeezy_events_pkey PRIMARY KEY (id);


--
-- Name: password_reset_attempts password_reset_attempts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.password_reset_attempts
    ADD CONSTRAINT password_reset_attempts_pkey PRIMARY KEY (id);


--
-- Name: payment_transactions payment_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_transactions
    ADD CONSTRAINT payment_transactions_pkey PRIMARY KEY (id);


--
-- Name: payment_transactions payment_transactions_stripe_payment_intent_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_transactions
    ADD CONSTRAINT payment_transactions_stripe_payment_intent_id_key UNIQUE (stripe_payment_intent_id);


--
-- Name: stripe_events stripe_events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stripe_events
    ADD CONSTRAINT stripe_events_pkey PRIMARY KEY (id);


--
-- Name: stripe_events stripe_events_stripe_event_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stripe_events
    ADD CONSTRAINT stripe_events_stripe_event_id_key UNIQUE (stripe_event_id);


--
-- Name: subscriptions subscriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscriptions
    ADD CONSTRAINT subscriptions_pkey PRIMARY KEY (id);


--
-- Name: subscriptions subscriptions_stripe_subscription_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscriptions
    ADD CONSTRAINT subscriptions_stripe_subscription_id_key UNIQUE (stripe_subscription_id);


--
-- Name: user_preferences unique_user_preferences; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_preferences
    ADD CONSTRAINT unique_user_preferences UNIQUE (user_id);


--
-- Name: usage_limits usage_limits_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usage_limits
    ADD CONSTRAINT usage_limits_pkey PRIMARY KEY (id);


--
-- Name: usage_limits usage_limits_tier_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usage_limits
    ADD CONSTRAINT usage_limits_tier_key UNIQUE (tier);


--
-- Name: usage_tracking usage_tracking_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usage_tracking
    ADD CONSTRAINT usage_tracking_pkey PRIMARY KEY (id);


--
-- Name: user_preferences user_preferences_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_preferences
    ADD CONSTRAINT user_preferences_pkey PRIMARY KEY (id);


--
-- Name: user_profiles user_profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_profiles
    ADD CONSTRAINT user_profiles_pkey PRIMARY KEY (id);


--
-- Name: user_sessions user_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_sessions
    ADD CONSTRAINT user_sessions_pkey PRIMARY KEY (id);


--
-- Name: user_sessions user_sessions_session_token_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_sessions
    ADD CONSTRAINT user_sessions_session_token_key UNIQUE (session_token);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_google_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_google_id_key UNIQUE (google_id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_stripe_customer_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_stripe_customer_id_key UNIQUE (stripe_customer_id);


--
-- Name: idx_email_verification_tokens_expires_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_email_verification_tokens_expires_at ON public.email_verification_tokens USING btree (expires_at);


--
-- Name: idx_email_verification_tokens_token; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_email_verification_tokens_token ON public.email_verification_tokens USING btree (token);


--
-- Name: idx_email_verification_tokens_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_email_verification_tokens_user_id ON public.email_verification_tokens USING btree (user_id);


--
-- Name: idx_ls_events_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ls_events_created_at ON public.lemon_squeezy_events USING btree (created_at);


--
-- Name: idx_ls_events_event_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ls_events_event_id ON public.lemon_squeezy_events USING btree (event_id);


--
-- Name: idx_ls_events_processed; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ls_events_processed ON public.lemon_squeezy_events USING btree (processed);


--
-- Name: idx_payment_transactions_paid_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_payment_transactions_paid_at ON public.payment_transactions USING btree (paid_at);


--
-- Name: idx_payment_transactions_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_payment_transactions_status ON public.payment_transactions USING btree (status);


--
-- Name: idx_payment_transactions_stripe_payment_intent; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_payment_transactions_stripe_payment_intent ON public.payment_transactions USING btree (stripe_payment_intent_id);


--
-- Name: idx_payment_transactions_subscription_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_payment_transactions_subscription_id ON public.payment_transactions USING btree (subscription_id);


--
-- Name: idx_payment_transactions_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_payment_transactions_user_id ON public.payment_transactions USING btree (user_id);


--
-- Name: idx_reset_attempts_email_time; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_reset_attempts_email_time ON public.password_reset_attempts USING btree (email, attempted_at);


--
-- Name: idx_reset_attempts_ip_time; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_reset_attempts_ip_time ON public.password_reset_attempts USING btree (ip_address, attempted_at);


--
-- Name: idx_stripe_events_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_stripe_events_created_at ON public.stripe_events USING btree (created_at);


--
-- Name: idx_stripe_events_event_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_stripe_events_event_type ON public.stripe_events USING btree (event_type);


--
-- Name: idx_stripe_events_processed; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_stripe_events_processed ON public.stripe_events USING btree (processed);


--
-- Name: idx_stripe_events_stripe_event_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_stripe_events_stripe_event_id ON public.stripe_events USING btree (stripe_event_id);


--
-- Name: idx_subscriptions_period_end; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_subscriptions_period_end ON public.subscriptions USING btree (current_period_end);


--
-- Name: idx_subscriptions_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_subscriptions_status ON public.subscriptions USING btree (status);


--
-- Name: idx_subscriptions_stripe_subscription_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_subscriptions_stripe_subscription_id ON public.subscriptions USING btree (stripe_subscription_id);


--
-- Name: idx_subscriptions_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_subscriptions_user_id ON public.subscriptions USING btree (user_id);


--
-- Name: idx_subscriptions_user_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_subscriptions_user_status ON public.subscriptions USING btree (user_id, status);


--
-- Name: idx_usage_tracking_period_end; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_usage_tracking_period_end ON public.usage_tracking USING btree (period_end);


--
-- Name: idx_usage_tracking_user_period; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_usage_tracking_user_period ON public.usage_tracking USING btree (user_id, period_start, period_end);


--
-- Name: idx_usage_tracking_user_resource_period; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_usage_tracking_user_resource_period ON public.usage_tracking USING btree (user_id, resource_type, period_start);


--
-- Name: idx_user_preferences_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_preferences_user_id ON public.user_preferences USING btree (user_id);


--
-- Name: idx_user_profiles_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_profiles_user_id ON public.user_profiles USING btree (user_id);


--
-- Name: idx_user_sessions_expires; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_sessions_expires ON public.user_sessions USING btree (expires_at);


--
-- Name: idx_user_sessions_token; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_sessions_token ON public.user_sessions USING btree (session_token);


--
-- Name: idx_user_sessions_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_sessions_user_id ON public.user_sessions USING btree (user_id);


--
-- Name: idx_users_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_active ON public.users USING btree (is_active);


--
-- Name: idx_users_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_email ON public.users USING btree (email);


--
-- Name: idx_users_google_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_google_id ON public.users USING btree (google_id);


--
-- Name: idx_users_linkedin_url; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_linkedin_url ON public.users USING btree (linkedin_url);


--
-- Name: idx_users_password_reset_token; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_password_reset_token ON public.users USING btree (password_reset_token) WHERE (password_reset_token IS NOT NULL);


--
-- Name: idx_users_reset_token; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_reset_token ON public.users USING btree (reset_token) WHERE (reset_token IS NOT NULL);


--
-- Name: idx_users_stripe_customer; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_stripe_customer ON public.users USING btree (stripe_customer_id);


--
-- Name: idx_users_subscription_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_subscription_status ON public.users USING btree (subscription_status);


--
-- Name: idx_users_subscription_tier; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_subscription_tier ON public.users USING btree (subscription_tier);


--
-- Name: idx_users_verification_token; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_verification_token ON public.users USING btree (verification_token) WHERE (verification_token IS NOT NULL);


--
-- Name: subscriptions_ls_subscription_id_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX subscriptions_ls_subscription_id_key ON public.subscriptions USING btree (ls_subscription_id) WHERE (ls_subscription_id IS NOT NULL);


--
-- Name: subscriptions trigger_sync_subscription_to_user; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_sync_subscription_to_user AFTER INSERT OR UPDATE ON public.subscriptions FOR EACH ROW EXECUTE FUNCTION public.sync_subscription_to_user();


--
-- Name: users trigger_sync_user_to_postgres; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_sync_user_to_postgres AFTER INSERT OR UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.sync_user_to_postgres();


--
-- Name: TRIGGER trigger_sync_user_to_postgres ON users; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TRIGGER trigger_sync_user_to_postgres ON public.users IS 'Automatically syncs user data to postgres database for cross-service consistency';


--
-- Name: subscriptions trigger_update_subscription_timestamp; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_update_subscription_timestamp BEFORE UPDATE ON public.subscriptions FOR EACH ROW EXECUTE FUNCTION public.update_subscription_timestamp();


--
-- Name: usage_tracking trigger_update_usage_tracking_timestamp; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_update_usage_tracking_timestamp BEFORE UPDATE ON public.usage_tracking FOR EACH ROW EXECUTE FUNCTION public.update_usage_tracking_timestamp();


--
-- Name: email_verification_tokens email_verification_tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_verification_tokens
    ADD CONSTRAINT email_verification_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: payment_transactions payment_transactions_subscription_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_transactions
    ADD CONSTRAINT payment_transactions_subscription_id_fkey FOREIGN KEY (subscription_id) REFERENCES public.subscriptions(id) ON DELETE SET NULL;


--
-- Name: payment_transactions payment_transactions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_transactions
    ADD CONSTRAINT payment_transactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: subscriptions subscriptions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscriptions
    ADD CONSTRAINT subscriptions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: usage_tracking usage_tracking_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usage_tracking
    ADD CONSTRAINT usage_tracking_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: user_preferences user_preferences_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_preferences
    ADD CONSTRAINT user_preferences_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: user_profiles user_profiles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_profiles
    ADD CONSTRAINT user_profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: user_sessions user_sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_sessions
    ADD CONSTRAINT user_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict mMJOyev8GFSf0wMoO7On5e9kuazcL71FLYd5MwkpsqCYvgjZUe1jBQIAJLNmsS0

