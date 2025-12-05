--
-- PostgreSQL database dump
--

\restrict suaWzOajfW08V7OuquIi5zDRKQxki2yU0SEmYMyeCfYzrMMYKqSdXiOBN1WAeqm

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
-- Name: vector; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA public;


--
-- Name: EXTENSION vector; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION vector IS 'vector data type and ivfflat and hnsw access methods';


--
-- Name: build_rag_context(public.vector, jsonb, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.build_rag_context(query_embedding public.vector, query_filters jsonb DEFAULT '{}'::jsonb, max_posts integer DEFAULT 5) RETURNS TABLE(post_id character varying, title text, body_text text, similarity double precision, role_type character varying, level character varying, company character varying, outcome character varying, interview_topics jsonb)
    LANGUAGE plpgsql
    AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.post_id,
    p.title,
    p.body_text,
    1 - (p.embedding <=> query_embedding) as similarity,
    p.role_type,
    p.level,
    p.metadata->>'company' as company,
    p.outcome,
    p.interview_topics
  FROM scraped_posts p
  WHERE p.embedding IS NOT NULL
    -- Apply dynamic filters from JSONB
    AND (
      query_filters->>'role_type' IS NULL
      OR p.role_type = query_filters->>'role_type'
    )
    AND (
      query_filters->>'level' IS NULL
      OR p.level = query_filters->>'level'
    )
    AND (
      query_filters->>'outcome' IS NULL
      OR p.outcome = query_filters->>'outcome'
    )
  ORDER BY p.embedding <=> query_embedding
  LIMIT max_posts;
END;
$$;


--
-- Name: FUNCTION build_rag_context(query_embedding public.vector, query_filters jsonb, max_posts integer); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.build_rag_context(query_embedding public.vector, query_filters jsonb, max_posts integer) IS 'Retrieve top-k most relevant posts for RAG prompt context';


--
-- Name: complete_embedding_generation(integer, public.vector, public.vector, character varying); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.complete_embedding_generation(p_id integer, p_embedding public.vector, p_title_embedding public.vector, p_model character varying DEFAULT 'text-embedding-3-small'::character varying) RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
  UPDATE scraped_posts
  SET
    embedding = p_embedding,
    title_embedding = p_title_embedding,
    embedding_model = p_model,
    embedding_status = 'completed',
    embedding_generated_at = NOW(),
    embedding_error = NULL,
    updated_at = NOW()
  WHERE id = p_id;
END;
$$;


--
-- Name: compute_year_quarter(date); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.compute_year_quarter(input_date date) RETURNS character varying
    LANGUAGE plpgsql IMMUTABLE
    AS $$
BEGIN
  IF input_date IS NULL THEN
    RETURN NULL;
  END IF;

  RETURN TO_CHAR(input_date, 'YYYY') || '-Q' || TO_CHAR(input_date, 'Q');
END;
$$;


--
-- Name: fail_embedding_generation(integer, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fail_embedding_generation(p_id integer, p_error text) RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
  UPDATE scraped_posts
  SET
    embedding_status = 'failed',
    embedding_error = p_error,
    embedding_retry_count = embedding_retry_count + 1,
    updated_at = NOW()
  WHERE id = p_id;
END;
$$;


--
-- Name: find_similar_posts(public.vector, double precision, integer, character varying, character varying, character varying); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.find_similar_posts(query_embedding public.vector, match_threshold double precision DEFAULT 0.7, match_count integer DEFAULT 10, filter_role character varying DEFAULT NULL::character varying, filter_level character varying DEFAULT NULL::character varying, filter_outcome character varying DEFAULT NULL::character varying) RETURNS TABLE(id integer, post_id character varying, title text, similarity double precision, role_type character varying, level character varying, outcome character varying, company character varying, created_at timestamp without time zone)
    LANGUAGE plpgsql
    AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.post_id,
    p.title,
    1 - (p.embedding <=> query_embedding) as similarity,
    p.role_type,
    p.level,
    p.outcome,
    p.metadata->>'company' as company,
    p.created_at
  FROM scraped_posts p
  WHERE p.embedding IS NOT NULL
    AND 1 - (p.embedding <=> query_embedding) > match_threshold
    AND (filter_role IS NULL OR p.role_type = filter_role)
    AND (filter_level IS NULL OR p.level = filter_level)
    AND (filter_outcome IS NULL OR p.outcome = filter_outcome)
  ORDER BY p.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;


--
-- Name: FUNCTION find_similar_posts(query_embedding public.vector, match_threshold double precision, match_count integer, filter_role character varying, filter_level character varying, filter_outcome character varying); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.find_similar_posts(query_embedding public.vector, match_threshold double precision, match_count integer, filter_role character varying, filter_level character varying, filter_outcome character varying) IS 'Semantic search using cosine similarity with optional filters';


--
-- Name: get_level_experience(character varying); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_level_experience(level_code character varying) RETURNS TABLE(min_years integer, max_years integer)
    LANGUAGE plpgsql
    AS $$
BEGIN
  RETURN QUERY
  SELECT experience_years_min, experience_years_max
  FROM level_mappings
  WHERE standard_level = level_code;
END;
$$;


--
-- Name: hybrid_search(public.vector, text, double precision, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.hybrid_search(query_embedding public.vector, query_text text, match_threshold double precision DEFAULT 0.7, match_count integer DEFAULT 20) RETURNS TABLE(id integer, post_id character varying, title text, similarity double precision, keyword_rank double precision, hybrid_score double precision, role_type character varying, level character varying, company character varying)
    LANGUAGE plpgsql
    AS $$
BEGIN
  RETURN QUERY
  WITH vector_search AS (
    SELECT
      p.id,
      p.post_id,
      p.title,
      1 - (p.embedding <=> query_embedding) as similarity,
      p.role_type,
      p.level,
      p.metadata->>'company' as company
    FROM scraped_posts p
    WHERE p.embedding IS NOT NULL
      AND 1 - (p.embedding <=> query_embedding) > match_threshold
    ORDER BY p.embedding <=> query_embedding
    LIMIT match_count * 2
  ),
  keyword_search AS (
    SELECT
      p.id,
      ts_rank(
        to_tsvector('english', COALESCE(p.title, '') || ' ' || COALESCE(p.body_text, '')),
        plainto_tsquery('english', query_text)
      ) as rank
    FROM scraped_posts p
    WHERE to_tsvector('english', COALESCE(p.title, '') || ' ' || COALESCE(p.body_text, ''))
      @@ plainto_tsquery('english', query_text)
  )
  SELECT
    v.id,
    v.post_id,
    v.title,
    v.similarity,
    COALESCE(k.rank, 0) as keyword_rank,
    (v.similarity * 0.7 + COALESCE(k.rank, 0) * 0.3) as hybrid_score,
    v.role_type,
    v.level,
    v.company
  FROM vector_search v
  LEFT JOIN keyword_search k ON v.id = k.id
  ORDER BY hybrid_score DESC
  LIMIT match_count;
END;
$$;


--
-- Name: FUNCTION hybrid_search(query_embedding public.vector, query_text text, match_threshold double precision, match_count integer); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.hybrid_search(query_embedding public.vector, query_text text, match_threshold double precision, match_count integer) IS 'Combines vector similarity (70%) and keyword matching (30%)';


--
-- Name: normalize_level(character varying, character varying); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.normalize_level(company_name character varying, company_level character varying) RETURNS character varying
    LANGUAGE plpgsql
    AS $$
DECLARE
  std_level VARCHAR;
BEGIN
  SELECT standard_level INTO std_level
  FROM company_level_mappings
  WHERE company = company_name
    AND company_level_code = company_level
  LIMIT 1;

  RETURN COALESCE(std_level, 'L3'); -- Default to L3 if not found
END;
$$;


--
-- Name: start_embedding_generation(integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.start_embedding_generation(p_id integer) RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
  UPDATE scraped_posts
  SET
    embedding_status = 'processing',
    updated_at = NOW()
  WHERE id = p_id;
END;
$$;


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
-- Name: update_assistant_conversations_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_assistant_conversations_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


--
-- Name: update_learning_maps_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_learning_maps_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


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
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
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
-- Name: update_user_workflows_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_user_workflows_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


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
-- Name: analysis_connections; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.analysis_connections (
    id integer NOT NULL,
    post1_id integer,
    post2_id integer,
    connection_type character varying(50) NOT NULL,
    strength numeric(3,2) NOT NULL,
    insights text,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT analysis_connections_strength_check CHECK (((strength >= 0.0) AND (strength <= 1.0)))
);


--
-- Name: analysis_connections_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.analysis_connections_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: analysis_connections_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.analysis_connections_id_seq OWNED BY public.analysis_connections.id;


--
-- Name: analysis_results; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.analysis_results (
    id integer NOT NULL,
    original_text text NOT NULL,
    company character varying(200),
    role character varying(200),
    sentiment character varying(20),
    interview_topics jsonb DEFAULT '[]'::jsonb,
    industry character varying(100),
    experience_level character varying(20),
    preparation_materials jsonb DEFAULT '[]'::jsonb,
    key_insights jsonb DEFAULT '[]'::jsonb,
    user_id integer,
    batch_id character varying(100),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    interview_stages jsonb DEFAULT '[]'::jsonb,
    difficulty_level character varying(20),
    timeline text,
    outcome character varying(20),
    analysis_version character varying(10) DEFAULT '2.0'::character varying,
    confidence_score numeric(3,2),
    tags text[],
    metadata jsonb DEFAULT '{}'::jsonb,
    full_result jsonb,
    CONSTRAINT analysis_results_difficulty_level_check CHECK (((difficulty_level)::text = ANY ((ARRAY['easy'::character varying, 'medium'::character varying, 'hard'::character varying])::text[]))),
    CONSTRAINT analysis_results_experience_level_check CHECK (((experience_level)::text = ANY ((ARRAY['intern'::character varying, 'entry'::character varying, 'mid'::character varying, 'senior'::character varying, 'executive'::character varying])::text[]))),
    CONSTRAINT analysis_results_outcome_check CHECK (((outcome)::text = ANY ((ARRAY['passed'::character varying, 'failed'::character varying, 'pending'::character varying, 'unknown'::character varying])::text[]))),
    CONSTRAINT analysis_results_sentiment_check CHECK (((sentiment)::text = ANY ((ARRAY['positive'::character varying, 'negative'::character varying, 'neutral'::character varying])::text[])))
);


--
-- Name: analysis_results_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.analysis_results_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: analysis_results_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.analysis_results_id_seq OWNED BY public.analysis_results.id;


--
-- Name: assistant_conversations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.assistant_conversations (
    id integer NOT NULL,
    user_id integer NOT NULL,
    title character varying(255) NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    metadata jsonb
);


--
-- Name: assistant_conversations_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.assistant_conversations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: assistant_conversations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.assistant_conversations_id_seq OWNED BY public.assistant_conversations.id;


--
-- Name: assistant_messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.assistant_messages (
    id integer NOT NULL,
    conversation_id integer NOT NULL,
    role character varying(32) NOT NULL,
    content text NOT NULL,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT assistant_messages_role_check CHECK (((role)::text = ANY ((ARRAY['user'::character varying, 'assistant'::character varying])::text[])))
);


--
-- Name: assistant_messages_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.assistant_messages_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: assistant_messages_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.assistant_messages_id_seq OWNED BY public.assistant_messages.id;


--
-- Name: batch_analysis_cache; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.batch_analysis_cache (
    id integer NOT NULL,
    batch_id character varying(100) NOT NULL,
    user_post_embeddings jsonb,
    pattern_analysis jsonb,
    cached_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    embedding_model character varying(100),
    cache_hits integer DEFAULT 0,
    last_accessed_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    enhanced_intelligence jsonb DEFAULT '{}'::jsonb,
    foundation_pool_size integer,
    user_posts_count integer,
    rag_similar_posts_count integer,
    user_id integer
);


--
-- Name: TABLE batch_analysis_cache; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.batch_analysis_cache IS 'Caches user post embeddings and pattern_analysis results to ensure deterministic batch reports';


--
-- Name: COLUMN batch_analysis_cache.user_post_embeddings; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.batch_analysis_cache.user_post_embeddings IS 'Array of {text, embedding} objects for user posts';


--
-- Name: COLUMN batch_analysis_cache.pattern_analysis; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.batch_analysis_cache.pattern_analysis IS 'Full pattern_analysis result object (skills, companies, roles, etc)';


--
-- Name: COLUMN batch_analysis_cache.cache_hits; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.batch_analysis_cache.cache_hits IS 'Number of times this cache entry was used (for monitoring)';


--
-- Name: COLUMN batch_analysis_cache.enhanced_intelligence; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.batch_analysis_cache.enhanced_intelligence IS 'Enhanced intelligence from 21 LLM fields: hiring process, rejections, question metadata, timelines, experience levels';


--
-- Name: COLUMN batch_analysis_cache.foundation_pool_size; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.batch_analysis_cache.foundation_pool_size IS 'Total foundation pool size (user posts + RAG similar posts)';


--
-- Name: COLUMN batch_analysis_cache.user_posts_count; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.batch_analysis_cache.user_posts_count IS 'Number of user-submitted posts in this batch';


--
-- Name: COLUMN batch_analysis_cache.rag_similar_posts_count; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.batch_analysis_cache.rag_similar_posts_count IS 'Number of RAG similar posts used for enhanced intelligence';


--
-- Name: batch_analysis_cache_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.batch_analysis_cache_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: batch_analysis_cache_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.batch_analysis_cache_id_seq OWNED BY public.batch_analysis_cache.id;


--
-- Name: benchmark_metadata; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.benchmark_metadata (
    id integer NOT NULL,
    cache_type character varying(100) NOT NULL,
    last_computed timestamp without time zone DEFAULT now() NOT NULL,
    total_posts_analyzed integer DEFAULT 0 NOT NULL,
    computation_duration_ms integer,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: TABLE benchmark_metadata; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.benchmark_metadata IS 'Tracks benchmark cache freshness and statistics';


--
-- Name: benchmark_metadata_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.benchmark_metadata_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: benchmark_metadata_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.benchmark_metadata_id_seq OWNED BY public.benchmark_metadata.id;


--
-- Name: benchmark_role_intelligence; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.benchmark_role_intelligence (
    id integer NOT NULL,
    role_type character varying(255) NOT NULL,
    total_posts integer NOT NULL,
    success_count integer DEFAULT 0 NOT NULL,
    failure_count integer DEFAULT 0 NOT NULL,
    success_rate numeric(5,2),
    top_skills jsonb,
    avg_salary_range character varying(100),
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: TABLE benchmark_role_intelligence; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.benchmark_role_intelligence IS 'Pre-computed role statistics from all relevant posts';


--
-- Name: benchmark_role_intelligence_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.benchmark_role_intelligence_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: benchmark_role_intelligence_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.benchmark_role_intelligence_id_seq OWNED BY public.benchmark_role_intelligence.id;


--
-- Name: benchmark_stage_success; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.benchmark_stage_success (
    id integer NOT NULL,
    company character varying(255) NOT NULL,
    interview_stage character varying(255) NOT NULL,
    total_posts integer NOT NULL,
    success_count integer DEFAULT 0 NOT NULL,
    failure_count integer DEFAULT 0 NOT NULL,
    success_rate numeric(5,2),
    avg_duration_days integer,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: TABLE benchmark_stage_success; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.benchmark_stage_success IS 'Pre-computed interview stage success rates by company';


--
-- Name: benchmark_stage_success_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.benchmark_stage_success_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: benchmark_stage_success_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.benchmark_stage_success_id_seq OWNED BY public.benchmark_stage_success.id;


--
-- Name: company_level_mappings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.company_level_mappings (
    id integer NOT NULL,
    company character varying(100) NOT NULL,
    standard_level character varying(10) NOT NULL,
    company_level_code character varying(50) NOT NULL,
    company_level_name character varying(100),
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: TABLE company_level_mappings; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.company_level_mappings IS 'Company-specific level codes mapped to standard levels';


--
-- Name: company_level_mappings_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.company_level_mappings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: company_level_mappings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.company_level_mappings_id_seq OWNED BY public.company_level_mappings.id;


--
-- Name: experience_analysis_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.experience_analysis_history (
    id integer NOT NULL,
    experience_id integer,
    analyzed_by_user_id integer NOT NULL,
    workflow_id character varying(255),
    analysis_type character varying(50) NOT NULL,
    analyzed_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: TABLE experience_analysis_history; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.experience_analysis_history IS 'Tracks user analysis usage for tier-based rate limiting';


--
-- Name: experience_analysis_history_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.experience_analysis_history_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: experience_analysis_history_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.experience_analysis_history_id_seq OWNED BY public.experience_analysis_history.id;


--
-- Name: interview_question_metadata; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.interview_question_metadata (
    question_id integer NOT NULL,
    leetcode_number integer,
    leetcode_title character varying(255),
    leetcode_difficulty character varying(20),
    leetcode_url text,
    hackerrank_url text,
    similar_questions jsonb DEFAULT '[]'::jsonb,
    topic_tags text[] DEFAULT '{}'::text[],
    company_frequency jsonb DEFAULT '{}'::jsonb,
    success_patterns jsonb DEFAULT '{}'::jsonb,
    common_mistakes jsonb DEFAULT '[]'::jsonb,
    preparation_resources jsonb DEFAULT '[]'::jsonb,
    last_updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: interview_questions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.interview_questions (
    id integer NOT NULL,
    post_id character varying(50),
    question_text text NOT NULL,
    question_type character varying(50),
    difficulty character varying(20),
    category character varying(100),
    embedding public.vector(384),
    embedding_generated_at timestamp without time zone,
    role_type character varying(50),
    level character varying(10),
    company character varying(100),
    interview_stage character varying(50),
    extracted_from text,
    extraction_confidence double precision,
    extracted_at timestamp without time zone DEFAULT now(),
    verified boolean DEFAULT false,
    verified_by integer,
    verified_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now(),
    llm_difficulty character varying(20),
    llm_category character varying(100),
    estimated_time_minutes integer,
    hints_given jsonb DEFAULT '[]'::jsonb,
    common_mistakes jsonb DEFAULT '[]'::jsonb,
    optimal_approach text,
    follow_up_questions jsonb DEFAULT '[]'::jsonb,
    real_world_application text,
    interviewer_focused_on jsonb DEFAULT '[]'::jsonb,
    candidate_struggled_with text,
    preparation_resources jsonb DEFAULT '[]'::jsonb,
    success_rate_reported character varying(50),
    llm_extracted_at timestamp without time zone,
    CONSTRAINT interview_questions_llm_difficulty_check CHECK ((((llm_difficulty)::text = ANY ((ARRAY['easy'::character varying, 'medium'::character varying, 'hard'::character varying])::text[])) OR (llm_difficulty IS NULL)))
);


--
-- Name: TABLE interview_questions; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.interview_questions IS 'Extracted interview questions with embeddings for semantic search';


--
-- Name: COLUMN interview_questions.llm_difficulty; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.interview_questions.llm_difficulty IS 'LLM-extracted difficulty (more accurate than rule-based): easy/medium/hard';


--
-- Name: COLUMN interview_questions.llm_category; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.interview_questions.llm_category IS 'LLM-extracted question category (better than rule-based)';


--
-- Name: COLUMN interview_questions.estimated_time_minutes; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.interview_questions.estimated_time_minutes IS 'Time given to solve this question (LLM extracted)';


--
-- Name: COLUMN interview_questions.hints_given; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.interview_questions.hints_given IS 'Array of hints interviewer provided (LLM extracted)';


--
-- Name: COLUMN interview_questions.common_mistakes; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.interview_questions.common_mistakes IS 'Array of common mistakes to avoid (LLM extracted)';


--
-- Name: COLUMN interview_questions.optimal_approach; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.interview_questions.optimal_approach IS 'Best approach/technique to solve (LLM extracted)';


--
-- Name: COLUMN interview_questions.follow_up_questions; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.interview_questions.follow_up_questions IS 'Array of follow-up questions asked (LLM extracted)';


--
-- Name: COLUMN interview_questions.real_world_application; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.interview_questions.real_world_application IS 'Real-world use case for this question (LLM extracted)';


--
-- Name: COLUMN interview_questions.interviewer_focused_on; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.interview_questions.interviewer_focused_on IS 'Array of what interviewer cared about most (LLM extracted)';


--
-- Name: COLUMN interview_questions.candidate_struggled_with; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.interview_questions.candidate_struggled_with IS 'What candidate found difficult (LLM extracted)';


--
-- Name: COLUMN interview_questions.preparation_resources; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.interview_questions.preparation_resources IS 'Array of recommended prep resources (LLM extracted)';


--
-- Name: COLUMN interview_questions.success_rate_reported; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.interview_questions.success_rate_reported IS 'Pass rate if mentioned (LLM extracted)';


--
-- Name: COLUMN interview_questions.llm_extracted_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.interview_questions.llm_extracted_at IS 'Timestamp when LLM extraction was performed';


--
-- Name: interview_questions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.interview_questions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: interview_questions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.interview_questions_id_seq OWNED BY public.interview_questions.id;


--
-- Name: learning_map_resources; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.learning_map_resources (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    type character varying(50) NOT NULL,
    url text,
    mention_count integer DEFAULT 0,
    success_rate numeric(5,2),
    avg_usefulness_rating numeric(3,2),
    skills text[] DEFAULT '{}'::text[],
    companies text[] DEFAULT '{}'::text[],
    roles text[] DEFAULT '{}'::text[],
    difficulty_level character varying(50),
    source_posts jsonb DEFAULT '[]'::jsonb,
    first_seen_at timestamp without time zone DEFAULT now(),
    last_updated_at timestamp without time zone DEFAULT now(),
    metadata jsonb DEFAULT '{}'::jsonb
);


--
-- Name: learning_map_resources_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.learning_map_resources_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: learning_map_resources_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.learning_map_resources_id_seq OWNED BY public.learning_map_resources.id;


--
-- Name: learning_maps_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.learning_maps_history (
    id integer NOT NULL,
    user_id integer NOT NULL,
    title character varying(500) NOT NULL,
    summary text,
    difficulty character varying(50),
    timeline_weeks integer,
    is_crazy_plan boolean DEFAULT false,
    milestones jsonb DEFAULT '[]'::jsonb,
    outcomes jsonb DEFAULT '[]'::jsonb,
    next_steps jsonb DEFAULT '[]'::jsonb,
    analysis_count integer DEFAULT 0,
    analysis_ids jsonb DEFAULT '[]'::jsonb,
    user_goals jsonb DEFAULT '{}'::jsonb,
    personalization_score numeric(3,2),
    status character varying(50) DEFAULT 'active'::character varying,
    progress integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    last_viewed_at timestamp without time zone,
    source_report_id character varying(255),
    foundation_posts integer,
    data_coverage character varying(20),
    avg_prep_weeks numeric(4,1),
    company_tracks jsonb DEFAULT '[]'::jsonb,
    analytics jsonb DEFAULT '{}'::jsonb,
    skills_roadmap jsonb DEFAULT '{}'::jsonb,
    knowledge_gaps jsonb DEFAULT '{}'::jsonb,
    curated_resources jsonb DEFAULT '[]'::jsonb,
    timeline jsonb DEFAULT '{}'::jsonb,
    expected_outcomes jsonb DEFAULT '[]'::jsonb,
    common_pitfalls jsonb,
    readiness_checklist jsonb,
    success_factors jsonb DEFAULT '[]'::jsonb,
    database_resources jsonb DEFAULT '[]'::jsonb,
    timeline_statistics jsonb,
    pitfalls_narrative jsonb,
    improvement_areas jsonb,
    resource_recommendations jsonb,
    preparation_expectations jsonb,
    CONSTRAINT valid_progress CHECK (((progress >= 0) AND (progress <= 100)))
);


--
-- Name: TABLE learning_maps_history; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.learning_maps_history IS 'Stores all generated learning maps with full history per user';


--
-- Name: COLUMN learning_maps_history.is_crazy_plan; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.learning_maps_history.is_crazy_plan IS 'Whether this map was generated with CrazyPlan mode (aggressive 1-month timeline)';


--
-- Name: COLUMN learning_maps_history.milestones; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.learning_maps_history.milestones IS 'Array of milestone objects with week, title, description, skills, tasks, resources';


--
-- Name: COLUMN learning_maps_history.status; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.learning_maps_history.status IS 'Current status: active (default), archived (hidden but kept), completed (user finished)';


--
-- Name: COLUMN learning_maps_history.progress; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.learning_maps_history.progress IS 'User-tracked completion percentage (0-100)';


--
-- Name: COLUMN learning_maps_history.source_report_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.learning_maps_history.source_report_id IS 'Link to comprehensive analysis report (e.g., batch_1_abc123)';


--
-- Name: COLUMN learning_maps_history.foundation_posts; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.learning_maps_history.foundation_posts IS 'Total foundation posts (seed + RAG) used for generation';


--
-- Name: COLUMN learning_maps_history.data_coverage; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.learning_maps_history.data_coverage IS 'Data quality: High/Medium/Low based on foundation size';


--
-- Name: COLUMN learning_maps_history.avg_prep_weeks; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.learning_maps_history.avg_prep_weeks IS 'Average preparation weeks from real posts';


--
-- Name: COLUMN learning_maps_history.company_tracks; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.learning_maps_history.company_tracks IS 'Company-specific learning tracks (JSON array)';


--
-- Name: COLUMN learning_maps_history.analytics; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.learning_maps_history.analytics IS 'Analytics data for visualization (JSON object)';


--
-- Name: COLUMN learning_maps_history.skills_roadmap; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.learning_maps_history.skills_roadmap IS 'LLM-generated skills roadmap with modules, each containing skills, topics, and resources';


--
-- Name: COLUMN learning_maps_history.knowledge_gaps; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.learning_maps_history.knowledge_gaps IS 'Identified knowledge gaps from failure patterns with gap descriptions and practice recommendations';


--
-- Name: COLUMN learning_maps_history.curated_resources; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.learning_maps_history.curated_resources IS 'Curated learning resources with titles, URLs, types, relevance scores, and effectiveness ratings';


--
-- Name: COLUMN learning_maps_history.timeline; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.learning_maps_history.timeline IS 'Week-by-week learning timeline with LLM-generated narratives, focus areas, and milestones';


--
-- Name: COLUMN learning_maps_history.expected_outcomes; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.learning_maps_history.expected_outcomes IS 'Expected learning outcomes and skill achievements';


--
-- Name: COLUMN learning_maps_history.common_pitfalls; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.learning_maps_history.common_pitfalls IS 'Common pitfalls aggregated from mistakes_made and rejection_reasons fields (object with pitfalls array and evidence_quality)';


--
-- Name: COLUMN learning_maps_history.readiness_checklist; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.learning_maps_history.readiness_checklist IS 'Interview readiness checklist from success_factors and improvement_areas (object with checklist_items array and evidence_quality)';


--
-- Name: COLUMN learning_maps_history.success_factors; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.learning_maps_history.success_factors IS 'Success factors from post metadata (array of objects)';


--
-- Name: COLUMN learning_maps_history.database_resources; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.learning_maps_history.database_resources IS 'Curated resources from post metadata (array of objects)';


--
-- Name: COLUMN learning_maps_history.timeline_statistics; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.learning_maps_history.timeline_statistics IS 'Timeline statistics aggregated from post metadata (object with weeks_to_offer, weeks_studying, etc)';


--
-- Name: COLUMN learning_maps_history.pitfalls_narrative; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.learning_maps_history.pitfalls_narrative IS 'LLM-synthesized narrative insights from common_pitfalls (object with summary, top_pitfalls array with explanations and how_to_avoid)';


--
-- Name: COLUMN learning_maps_history.improvement_areas; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.learning_maps_history.improvement_areas IS 'LLM-synthesized improvement recommendations from readiness_checklist (object with summary, priority_skills array with action_plan)';


--
-- Name: COLUMN learning_maps_history.resource_recommendations; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.learning_maps_history.resource_recommendations IS 'LLM-synthesized resource guidance from database_resources (object with summary, ranked_resources with when_to_use and how_to_use)';


--
-- Name: COLUMN learning_maps_history.preparation_expectations; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.learning_maps_history.preparation_expectations IS 'LLM-synthesized preparation expectations from timeline_statistics (object with realistic_timeline, success_indicators, common_mistakes)';


--
-- Name: learning_maps_history_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.learning_maps_history_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: learning_maps_history_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.learning_maps_history_id_seq OWNED BY public.learning_maps_history.id;


--
-- Name: learning_topics; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.learning_topics (
    id integer NOT NULL,
    topic_name character varying(200) NOT NULL,
    topic_category character varying(100),
    description text,
    embedding public.vector(384),
    embedding_generated_at timestamp without time zone,
    difficulty_level character varying(20),
    estimated_hours integer,
    prerequisites text[],
    related_topics text[],
    mention_count integer DEFAULT 0,
    roles text[],
    companies text[],
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: TABLE learning_topics; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.learning_topics IS 'Hierarchical learning topics extracted from interview data';


--
-- Name: learning_topics_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.learning_topics_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: learning_topics_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.learning_topics_id_seq OWNED BY public.learning_topics.id;


--
-- Name: leetcode_questions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.leetcode_questions (
    id integer NOT NULL,
    leetcode_id integer NOT NULL,
    frontend_id integer,
    title text NOT NULL,
    title_slug text NOT NULL,
    difficulty character varying(20) NOT NULL,
    difficulty_numeric integer NOT NULL,
    is_premium boolean DEFAULT false,
    topic_tags jsonb DEFAULT '[]'::jsonb,
    stats jsonb,
    url text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: leetcode_questions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.leetcode_questions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: leetcode_questions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.leetcode_questions_id_seq OWNED BY public.leetcode_questions.id;


--
-- Name: level_mappings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.level_mappings (
    id integer NOT NULL,
    standard_level character varying(10) NOT NULL,
    level_label character varying(50) NOT NULL,
    experience_years_min integer,
    experience_years_max integer,
    description text,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: TABLE level_mappings; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.level_mappings IS 'Standard level definitions (L1-L8) with experience ranges';


--
-- Name: level_mappings_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.level_mappings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: level_mappings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.level_mappings_id_seq OWNED BY public.level_mappings.id;


--
-- Name: question_categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.question_categories (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    parent_id integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: question_categories_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.question_categories_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: question_categories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.question_categories_id_seq OWNED BY public.question_categories.id;


--
-- Name: question_resources; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.question_resources (
    id integer NOT NULL,
    question_id integer,
    resource_type character varying(50) NOT NULL,
    resource_url character varying(500) NOT NULL,
    description text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: question_resources_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.question_resources_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: question_resources_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.question_resources_id_seq OWNED BY public.question_resources.id;


--
-- Name: questions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.questions (
    id integer NOT NULL,
    category_id integer,
    title character varying(200) NOT NULL,
    content text NOT NULL,
    question_type character varying(50) NOT NULL,
    difficulty character varying(20) DEFAULT 'medium'::character varying,
    tags text[],
    is_active boolean DEFAULT true,
    created_by integer NOT NULL,
    solution text,
    hints text[],
    time_limit_minutes integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: questions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.questions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: questions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.questions_id_seq OWNED BY public.questions.id;


--
-- Name: role_types; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.role_types (
    id integer NOT NULL,
    role_code character varying(50) NOT NULL,
    role_name character varying(200) NOT NULL,
    role_category character varying(50) NOT NULL,
    description text,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: TABLE role_types; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.role_types IS 'Standardized role type taxonomy with categories';


--
-- Name: role_types_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.role_types_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: role_types_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.role_types_id_seq OWNED BY public.role_types.id;


--
-- Name: scraped_posts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.scraped_posts (
    id integer NOT NULL,
    post_id character varying(100) NOT NULL,
    title text NOT NULL,
    author character varying(100),
    created_at timestamp without time zone,
    url text NOT NULL,
    body_text text,
    potential_outcome character varying(20),
    confidence_score numeric(3,2),
    subreddit character varying(100),
    metadata jsonb DEFAULT '{}'::jsonb,
    word_count integer,
    scraped_at timestamp without time zone DEFAULT now(),
    created_at_db timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    role_type character varying(100),
    role_full_name character varying(200),
    role_category character varying(100),
    level character varying(10),
    level_label character varying(100),
    experience_years integer,
    company_specific_level character varying(100),
    interview_stage character varying(100),
    interview_round integer,
    outcome character varying(50),
    outcome_stage character varying(100),
    tech_stack text[],
    primary_language character varying(50),
    frameworks text[],
    tools text[],
    interview_topics jsonb DEFAULT '{}'::jsonb,
    preparation jsonb DEFAULT '{}'::jsonb,
    compensation jsonb DEFAULT '{}'::jsonb,
    location jsonb DEFAULT '{}'::jsonb,
    timeline jsonb DEFAULT '{}'::jsonb,
    comments jsonb DEFAULT '[]'::jsonb,
    comment_count integer DEFAULT 0,
    labeling_status character varying(20) DEFAULT 'pending'::character varying,
    verified_outcome character varying(20),
    labeled_at timestamp without time zone,
    labeled_by integer,
    embedding public.vector(384),
    embedding_model character varying(100) DEFAULT 'text-embedding-3-small'::character varying,
    embedding_generated_at timestamp without time zone,
    embedding_version integer DEFAULT 1,
    title_embedding public.vector(384),
    title_embedding_generated_at timestamp without time zone,
    embedding_status character varying(20) DEFAULT 'pending'::character varying,
    embedding_error text,
    embedding_retry_count integer DEFAULT 0,
    source character varying(50) DEFAULT 'reddit'::character varying,
    is_relevant boolean DEFAULT true,
    relevance_source character varying(20) DEFAULT 'rules'::character varying,
    relevance_score double precision,
    relevance_checked_at timestamp without time zone DEFAULT now(),
    sentiment_category character varying(20),
    sentiment_score numeric(3,2),
    sentiment_reasoning text,
    sentiment_key_phrases jsonb,
    sentiment_confidence numeric(3,2) DEFAULT 0.85,
    sentiment_analyzed_at timestamp without time zone,
    backfill_analyzed_at timestamp without time zone,
    years_of_experience numeric(4,1),
    prep_duration_weeks numeric(5,1),
    leetcode_problems_solved integer,
    mock_interviews_count integer,
    prior_interview_attempts integer,
    rounds_passed integer,
    total_rounds integer,
    coding_difficulty character varying(20),
    system_design_difficulty character varying(20),
    positive_interviewer_signals text[],
    negative_interviewer_signals text[],
    interviewer_engagement character varying(20),
    received_hints boolean,
    base_salary integer,
    total_compensation integer,
    is_referral boolean,
    has_competing_offers boolean,
    interview_date date,
    post_year_quarter character varying(20),
    difficulty_level character varying(20),
    llm_industry character varying(100),
    preparation_materials jsonb DEFAULT '[]'::jsonb,
    key_insights jsonb DEFAULT '[]'::jsonb,
    llm_company character varying(100),
    llm_role character varying(100),
    llm_outcome character varying(50),
    llm_experience_level character varying(50),
    llm_interview_stages jsonb DEFAULT '[]'::jsonb,
    llm_extracted_at timestamp without time zone,
    remote_or_onsite character varying(20),
    offer_accepted boolean,
    compensation_mentioned boolean DEFAULT false,
    negotiation_occurred boolean DEFAULT false,
    referral_used boolean DEFAULT false,
    background_check_mentioned boolean DEFAULT false,
    rejection_reason text,
    interview_format character varying(50),
    followup_actions text,
    resources_used jsonb DEFAULT '[]'::jsonb,
    study_hours_per_week integer,
    areas_struggled jsonb DEFAULT '[]'::jsonb,
    failed_questions jsonb DEFAULT '[]'::jsonb,
    mistakes_made jsonb DEFAULT '[]'::jsonb,
    skills_tested jsonb DEFAULT '[]'::jsonb,
    weak_areas text[] DEFAULT '{}'::text[],
    success_factors jsonb DEFAULT '[]'::jsonb,
    helpful_resources jsonb DEFAULT '[]'::jsonb,
    preparation_time_days integer,
    practice_problem_count integer,
    interview_rounds integer,
    interview_duration_hours numeric(4,1),
    interviewer_feedback text[],
    rejection_reasons text[],
    offer_details jsonb DEFAULT '{}'::jsonb,
    job_market_conditions character varying(50),
    study_approach character varying(100),
    study_schedule text,
    prep_to_interview_gap_days integer,
    previous_interview_count integer,
    improvement_areas text[],
    CONSTRAINT check_coding_difficulty CHECK ((((coding_difficulty)::text = ANY ((ARRAY['easy'::character varying, 'medium'::character varying, 'hard'::character varying])::text[])) OR (coding_difficulty IS NULL))),
    CONSTRAINT check_interviewer_engagement CHECK ((((interviewer_engagement)::text = ANY ((ARRAY['engaged'::character varying, 'neutral'::character varying, 'disengaged'::character varying])::text[])) OR (interviewer_engagement IS NULL))),
    CONSTRAINT check_prep_duration_range CHECK (((prep_duration_weeks IS NULL) OR ((prep_duration_weeks >= (0)::numeric) AND (prep_duration_weeks <= 104.0)))),
    CONSTRAINT check_rounds_logic CHECK (((rounds_passed IS NULL) OR (total_rounds IS NULL) OR (rounds_passed <= total_rounds))),
    CONSTRAINT check_system_design_difficulty CHECK ((((system_design_difficulty)::text = ANY ((ARRAY['easy'::character varying, 'medium'::character varying, 'hard'::character varying])::text[])) OR (system_design_difficulty IS NULL))),
    CONSTRAINT check_years_experience_range CHECK (((years_of_experience IS NULL) OR ((years_of_experience >= (0)::numeric) AND (years_of_experience <= 50.0)))),
    CONSTRAINT scraped_posts_interview_format_check CHECK ((((interview_format)::text = ANY ((ARRAY['video'::character varying, 'phone'::character varying, 'in-person'::character varying, 'take-home'::character varying, 'mixed'::character varying])::text[])) OR (interview_format IS NULL))),
    CONSTRAINT scraped_posts_potential_outcome_check CHECK (((potential_outcome)::text = ANY ((ARRAY['positive'::character varying, 'negative'::character varying, 'unknown'::character varying])::text[]))),
    CONSTRAINT scraped_posts_remote_or_onsite_check CHECK ((((remote_or_onsite)::text = ANY ((ARRAY['remote'::character varying, 'onsite'::character varying, 'hybrid'::character varying])::text[])) OR (remote_or_onsite IS NULL))),
    CONSTRAINT sentiment_confidence_range CHECK (((sentiment_confidence IS NULL) OR ((sentiment_confidence >= 0.0) AND (sentiment_confidence <= 1.0)))),
    CONSTRAINT sentiment_score_range CHECK (((sentiment_score IS NULL) OR ((sentiment_score >= 1.0) AND (sentiment_score <= 5.0))))
);


--
-- Name: TABLE scraped_posts; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.scraped_posts IS 'Stores raw interview experience posts collected from Reddit via Apify scraper';


--
-- Name: COLUMN scraped_posts.potential_outcome; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.scraped_posts.potential_outcome IS 'AI-detected interview outcome: positive (success), negative (rejection), or unknown';


--
-- Name: COLUMN scraped_posts.confidence_score; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.scraped_posts.confidence_score IS 'Confidence in the outcome prediction (0.0-1.0)';


--
-- Name: COLUMN scraped_posts.metadata; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.scraped_posts.metadata IS 'JSON object containing extracted companies, roles, and technologies';


--
-- Name: COLUMN scraped_posts.role_type; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.scraped_posts.role_type IS 'Job role/title extracted from post (max 100 chars)';


--
-- Name: COLUMN scraped_posts.role_category; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.scraped_posts.role_category IS 'Role category (e.g., Engineering, Product) (max 100 chars)';


--
-- Name: COLUMN scraped_posts.level; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.scraped_posts.level IS 'Standardized level (L1-L8)';


--
-- Name: COLUMN scraped_posts.level_label; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.scraped_posts.level_label IS 'Experience level label (e.g., Senior, Staff) (max 100 chars)';


--
-- Name: COLUMN scraped_posts.company_specific_level; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.scraped_posts.company_specific_level IS 'Company-specific level designation (max 100 chars)';


--
-- Name: COLUMN scraped_posts.interview_stage; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.scraped_posts.interview_stage IS 'Interview stage/round description (max 100 chars)';


--
-- Name: COLUMN scraped_posts.outcome; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.scraped_posts.outcome IS 'Interview outcome: passed/failed/pending/unknown (max 50 chars)';


--
-- Name: COLUMN scraped_posts.outcome_stage; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.scraped_posts.outcome_stage IS 'Stage where outcome occurred (max 100 chars)';


--
-- Name: COLUMN scraped_posts.primary_language; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.scraped_posts.primary_language IS 'Primary programming language (max 50 chars)';


--
-- Name: COLUMN scraped_posts.interview_topics; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.scraped_posts.interview_topics IS 'JSON object with detailed topics by category';


--
-- Name: COLUMN scraped_posts.preparation; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.scraped_posts.preparation IS 'JSON object with preparation details (duration, resources, practice)';


--
-- Name: COLUMN scraped_posts.compensation; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.scraped_posts.compensation IS 'JSON object with salary/TC information if mentioned';


--
-- Name: COLUMN scraped_posts.location; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.scraped_posts.location IS 'LLM-extracted: Office location or "remote"';


--
-- Name: COLUMN scraped_posts.timeline; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.scraped_posts.timeline IS 'LLM-extracted interview process timeline description';


--
-- Name: COLUMN scraped_posts.comments; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.scraped_posts.comments IS 'Array of top comments from the Reddit post';


--
-- Name: COLUMN scraped_posts.labeling_status; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.scraped_posts.labeling_status IS 'Labeling workflow status: pending, verified, skipped, irrelevant';


--
-- Name: COLUMN scraped_posts.embedding; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.scraped_posts.embedding IS 'Full text embedding (title + body + comments combined)';


--
-- Name: COLUMN scraped_posts.embedding_model; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.scraped_posts.embedding_model IS 'OpenAI model used: text-embedding-3-small or text-embedding-3-large';


--
-- Name: COLUMN scraped_posts.title_embedding; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.scraped_posts.title_embedding IS 'Title-only embedding for quick matching';


--
-- Name: COLUMN scraped_posts.embedding_status; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.scraped_posts.embedding_status IS 'Status: pending, processing, completed, failed';


--
-- Name: COLUMN scraped_posts.source; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.scraped_posts.source IS 'Data source platform (max 50 chars)';


--
-- Name: COLUMN scraped_posts.is_relevant; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.scraped_posts.is_relevant IS 'TRUE if post is a relevant interview experience, FALSE if filtered out';


--
-- Name: COLUMN scraped_posts.relevance_source; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.scraped_posts.relevance_source IS 'Source of relevance label: rules, llm, classifier, manual';


--
-- Name: COLUMN scraped_posts.relevance_score; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.scraped_posts.relevance_score IS 'Confidence score (0-100) from filtering system';


--
-- Name: COLUMN scraped_posts.relevance_checked_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.scraped_posts.relevance_checked_at IS 'When relevance was determined';


--
-- Name: COLUMN scraped_posts.sentiment_category; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.scraped_posts.sentiment_category IS 'LLM-extracted sentiment (positive/negative/neutral)';


--
-- Name: COLUMN scraped_posts.backfill_analyzed_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.scraped_posts.backfill_analyzed_at IS 'Timestamp of comprehensive backfill analysis (metadata + sentiment + Phase 1)';


--
-- Name: COLUMN scraped_posts.years_of_experience; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.scraped_posts.years_of_experience IS 'Candidate years of professional experience (allows decimals like 2.5)';


--
-- Name: COLUMN scraped_posts.prep_duration_weeks; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.scraped_posts.prep_duration_weeks IS 'Interview preparation duration in weeks (allows decimals like 1.5)';


--
-- Name: COLUMN scraped_posts.leetcode_problems_solved; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.scraped_posts.leetcode_problems_solved IS 'Number of LeetCode problems solved (integer only)';


--
-- Name: COLUMN scraped_posts.mock_interviews_count; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.scraped_posts.mock_interviews_count IS 'LLM-extracted: Number of mock interviews practiced';


--
-- Name: COLUMN scraped_posts.prior_interview_attempts; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.scraped_posts.prior_interview_attempts IS 'Number of previous interview attempts at same company (integer only)';


--
-- Name: COLUMN scraped_posts.rounds_passed; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.scraped_posts.rounds_passed IS 'Number of interview rounds passed';


--
-- Name: COLUMN scraped_posts.total_rounds; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.scraped_posts.total_rounds IS 'Total number of interview rounds mentioned (LLM extracted)';


--
-- Name: COLUMN scraped_posts.coding_difficulty; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.scraped_posts.coding_difficulty IS 'Self-reported coding round difficulty';


--
-- Name: COLUMN scraped_posts.system_design_difficulty; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.scraped_posts.system_design_difficulty IS 'Self-reported system design round difficulty';


--
-- Name: COLUMN scraped_posts.positive_interviewer_signals; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.scraped_posts.positive_interviewer_signals IS 'Positive signals from interviewer behavior';


--
-- Name: COLUMN scraped_posts.negative_interviewer_signals; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.scraped_posts.negative_interviewer_signals IS 'Negative signals from interviewer behavior';


--
-- Name: COLUMN scraped_posts.interviewer_engagement; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.scraped_posts.interviewer_engagement IS 'Overall interviewer engagement level';


--
-- Name: COLUMN scraped_posts.received_hints; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.scraped_posts.received_hints IS 'Whether candidate received hints during interview';


--
-- Name: COLUMN scraped_posts.base_salary; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.scraped_posts.base_salary IS 'Base salary offered (USD)';


--
-- Name: COLUMN scraped_posts.total_compensation; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.scraped_posts.total_compensation IS 'Total compensation including equity and bonuses (USD)';


--
-- Name: COLUMN scraped_posts.is_referral; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.scraped_posts.is_referral IS 'Whether candidate applied through referral';


--
-- Name: COLUMN scraped_posts.has_competing_offers; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.scraped_posts.has_competing_offers IS 'Whether candidate had competing offers';


--
-- Name: COLUMN scraped_posts.interview_date; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.scraped_posts.interview_date IS 'LLM-extracted: Date when interview occurred (not post date)';


--
-- Name: COLUMN scraped_posts.post_year_quarter; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.scraped_posts.post_year_quarter IS 'Time period in format YYYY-QN (e.g., 2024-Q4, 2025-Q1)';


--
-- Name: COLUMN scraped_posts.difficulty_level; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.scraped_posts.difficulty_level IS 'LLM-extracted interview difficulty (easy/medium/hard)';


--
-- Name: COLUMN scraped_posts.llm_industry; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.scraped_posts.llm_industry IS 'LLM-extracted industry (tech, finance, healthcare, etc.)';


--
-- Name: COLUMN scraped_posts.preparation_materials; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.scraped_posts.preparation_materials IS 'LLM-extracted array of preparation materials mentioned';


--
-- Name: COLUMN scraped_posts.key_insights; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.scraped_posts.key_insights IS 'LLM-extracted array of key insights from the interview experience';


--
-- Name: COLUMN scraped_posts.llm_company; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.scraped_posts.llm_company IS 'LLM-extracted company name (hybrid: LLM primary, rules fallback)';


--
-- Name: COLUMN scraped_posts.llm_role; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.scraped_posts.llm_role IS 'LLM-extracted role title (hybrid: LLM primary, rules fallback)';


--
-- Name: COLUMN scraped_posts.llm_outcome; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.scraped_posts.llm_outcome IS 'LLM-extracted outcome (passed/failed/pending/unknown)';


--
-- Name: COLUMN scraped_posts.llm_experience_level; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.scraped_posts.llm_experience_level IS 'LLM-extracted experience level (intern/entry/mid/senior/executive)';


--
-- Name: COLUMN scraped_posts.llm_interview_stages; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.scraped_posts.llm_interview_stages IS 'LLM-extracted array of interview stages mentioned';


--
-- Name: COLUMN scraped_posts.llm_extracted_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.scraped_posts.llm_extracted_at IS 'Timestamp when comprehensive LLM extraction was performed';


--
-- Name: COLUMN scraped_posts.remote_or_onsite; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.scraped_posts.remote_or_onsite IS 'Interview location type: remote/onsite/hybrid (LLM extracted)';


--
-- Name: COLUMN scraped_posts.offer_accepted; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.scraped_posts.offer_accepted IS 'Whether candidate accepted the job offer (LLM extracted)';


--
-- Name: COLUMN scraped_posts.compensation_mentioned; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.scraped_posts.compensation_mentioned IS 'Whether salary/TC was discussed in post (LLM extracted)';


--
-- Name: COLUMN scraped_posts.negotiation_occurred; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.scraped_posts.negotiation_occurred IS 'Whether candidate negotiated the offer (LLM extracted)';


--
-- Name: COLUMN scraped_posts.referral_used; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.scraped_posts.referral_used IS 'Whether candidate got referral (LLM extracted)';


--
-- Name: COLUMN scraped_posts.background_check_mentioned; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.scraped_posts.background_check_mentioned IS 'Whether background check was mentioned (LLM extracted)';


--
-- Name: COLUMN scraped_posts.rejection_reason; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.scraped_posts.rejection_reason IS 'Reason for rejection if mentioned (LLM extracted)';


--
-- Name: COLUMN scraped_posts.interview_format; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.scraped_posts.interview_format IS 'Primary interview format: video/phone/in-person/take-home/mixed (LLM extracted)';


--
-- Name: COLUMN scraped_posts.followup_actions; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.scraped_posts.followup_actions IS 'Follow-up actions mentioned like thank you notes, checking status (LLM extracted)';


--
-- Name: COLUMN scraped_posts.resources_used; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.scraped_posts.resources_used IS 'LLM-extracted: Detailed breakdown of all prep materials. Format: [{"resource": "LeetCode Premium", "type": "platform", "duration_weeks": 8, "effectiveness": "high", "cost": "..."}]';


--
-- Name: COLUMN scraped_posts.study_hours_per_week; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.scraped_posts.study_hours_per_week IS 'How many hours per week the candidate studied (extracted from post)';


--
-- Name: COLUMN scraped_posts.areas_struggled; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.scraped_posts.areas_struggled IS 'LLM-extracted array of specific areas where candidate struggled. Format: [{"area": "System Design", "severity": "high", "details": "...", "interview_stage": "..."}]';


--
-- Name: COLUMN scraped_posts.failed_questions; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.scraped_posts.failed_questions IS 'LLM-extracted array of questions that candidate failed. Format: [{"question": "...", "type": "...", "difficulty": "...", "reason_failed": "...", "interview_stage": "..."}]';


--
-- Name: COLUMN scraped_posts.mistakes_made; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.scraped_posts.mistakes_made IS 'LLM-extracted array of mistakes and their impact. Format: [{"mistake": "...", "impact": "rejection/warning", "stage": "...", "lesson": "..."}]';


--
-- Name: COLUMN scraped_posts.skills_tested; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.scraped_posts.skills_tested IS 'LLM-extracted array of technical skills tested with pass/fail status. Format: [{"skill": "Binary Search", "category": "...", "passed": false, "difficulty": "...", "notes": "..."}]';


--
-- Name: COLUMN scraped_posts.weak_areas; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.scraped_posts.weak_areas IS 'LLM-extracted array of general weak areas (simplified version of areas_struggled)';


--
-- Name: COLUMN scraped_posts.success_factors; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.scraped_posts.success_factors IS 'LLM-extracted factors that contributed to success. Format: [{"factor": "Practiced 200 LC problems", "impact": "high", "category": "preparation"}]';


--
-- Name: COLUMN scraped_posts.helpful_resources; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.scraped_posts.helpful_resources IS 'LLM-extracted resources that helped (simplified version of resources_used)';


--
-- Name: COLUMN scraped_posts.preparation_time_days; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.scraped_posts.preparation_time_days IS 'LLM-extracted: Number of days spent preparing for interview';


--
-- Name: COLUMN scraped_posts.practice_problem_count; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.scraped_posts.practice_problem_count IS 'LLM-extracted: Number of practice problems solved during preparation';


--
-- Name: COLUMN scraped_posts.interview_rounds; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.scraped_posts.interview_rounds IS 'LLM-extracted: Total number of interview rounds (e.g., 5)';


--
-- Name: COLUMN scraped_posts.interview_duration_hours; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.scraped_posts.interview_duration_hours IS 'LLM-extracted: Total interview duration in hours (e.g., 4.5)';


--
-- Name: COLUMN scraped_posts.interviewer_feedback; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.scraped_posts.interviewer_feedback IS 'LLM-extracted: Array of feedback quotes from interviewers';


--
-- Name: COLUMN scraped_posts.rejection_reasons; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.scraped_posts.rejection_reasons IS 'LLM-extracted: Array of reasons for rejection if mentioned';


--
-- Name: COLUMN scraped_posts.offer_details; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.scraped_posts.offer_details IS 'LLM-extracted: Offer details if passed. Format: {"level": "L4", "tc": 250000, "team": "...", "location": "..."}';


--
-- Name: COLUMN scraped_posts.job_market_conditions; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.scraped_posts.job_market_conditions IS 'LLM-extracted: Market conditions mentioned (e.g., "hiring freeze", "competitive")';


--
-- Name: COLUMN scraped_posts.study_approach; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.scraped_posts.study_approach IS 'LLM-extracted: Study strategy (e.g., "self-study", "bootcamp", "tutor")';


--
-- Name: COLUMN scraped_posts.study_schedule; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.scraped_posts.study_schedule IS 'LLM-extracted: Study schedule description (e.g., "2 hours/day", "weekends only")';


--
-- Name: COLUMN scraped_posts.prep_to_interview_gap_days; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.scraped_posts.prep_to_interview_gap_days IS 'LLM-extracted: Days between end of prep and interview date';


--
-- Name: COLUMN scraped_posts.previous_interview_count; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.scraped_posts.previous_interview_count IS 'LLM-extracted: Number of times interviewed at this company before';


--
-- Name: COLUMN scraped_posts.improvement_areas; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.scraped_posts.improvement_areas IS 'LLM-extracted: What candidate wishes they had done differently';


--
-- Name: scraped_posts_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.scraped_posts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: scraped_posts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.scraped_posts_id_seq OWNED BY public.scraped_posts.id;


--
-- Name: scraper_runs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.scraper_runs (
    id integer NOT NULL,
    actor_run_id character varying(100),
    subreddit character varying(100),
    posts_requested integer,
    posts_scraped integer,
    posts_saved integer,
    success_rate numeric(5,2),
    status character varying(50),
    error_message text,
    started_at timestamp without time zone,
    finished_at timestamp without time zone,
    duration_seconds integer,
    created_at timestamp without time zone DEFAULT now(),
    CONSTRAINT scraper_runs_status_check CHECK (((status)::text = ANY ((ARRAY['success'::character varying, 'failed'::character varying, 'partial'::character varying])::text[])))
);


--
-- Name: TABLE scraper_runs; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.scraper_runs IS 'Tracks execution history and performance of the Apify scraper';


--
-- Name: scraper_runs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.scraper_runs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: scraper_runs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.scraper_runs_id_seq OWNED BY public.scraper_runs.id;


--
-- Name: scraping_backfill_progress; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.scraping_backfill_progress (
    id integer NOT NULL,
    source character varying(50) NOT NULL,
    source_identifier character varying(100) NOT NULL,
    current_position_timestamp bigint,
    end_timestamp bigint NOT NULL,
    posts_scraped_total integer DEFAULT 0,
    posts_saved_total integer DEFAULT 0,
    last_post_id character varying(100),
    status character varying(20) DEFAULT 'pending'::character varying,
    started_at timestamp without time zone,
    completed_at timestamp without time zone,
    last_run_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: TABLE scraping_backfill_progress; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.scraping_backfill_progress IS 'Tracks progress of backfill scraping to get ALL historical posts';


--
-- Name: COLUMN scraping_backfill_progress.current_position_timestamp; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.scraping_backfill_progress.current_position_timestamp IS 'Current position in time (going backwards)';


--
-- Name: COLUMN scraping_backfill_progress.end_timestamp; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.scraping_backfill_progress.end_timestamp IS 'Stop scraping when reaching this timestamp';


--
-- Name: scraping_backfill_progress_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.scraping_backfill_progress_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: scraping_backfill_progress_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.scraping_backfill_progress_id_seq OWNED BY public.scraping_backfill_progress.id;


--
-- Name: seed_post_markers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.seed_post_markers (
    id integer NOT NULL,
    batch_id character varying(255),
    entity_type character varying(50) NOT NULL,
    entity_value character varying(255) NOT NULL,
    seed_post_count integer DEFAULT 1 NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: TABLE seed_post_markers; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.seed_post_markers IS 'Tracks companies/roles from seed posts for highlighting';


--
-- Name: seed_post_markers_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.seed_post_markers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: seed_post_markers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.seed_post_markers_id_seq OWNED BY public.seed_post_markers.id;


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
-- Name: temporal_trends_view; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.temporal_trends_view AS
 SELECT post_year_quarter,
    role_type,
    (metadata ->> 'company'::text) AS company,
    count(*) AS post_count,
    count(*) FILTER (WHERE ((outcome)::text = 'offer'::text)) AS offers_count,
    count(*) FILTER (WHERE ((outcome)::text = 'rejected'::text)) AS rejected_count,
    round(((100.0 * (count(*) FILTER (WHERE ((outcome)::text = 'offer'::text)))::numeric) / (NULLIF(count(*), 0))::numeric), 1) AS success_rate,
    min(scraped_at) AS earliest_post,
    max(scraped_at) AS latest_post
   FROM public.scraped_posts
  WHERE ((post_year_quarter IS NOT NULL) AND (outcome IS NOT NULL))
  GROUP BY post_year_quarter, role_type, (metadata ->> 'company'::text)
  ORDER BY post_year_quarter DESC, (count(*)) DESC;


--
-- Name: VIEW temporal_trends_view; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON VIEW public.temporal_trends_view IS 'Aggregated temporal trends for quick analysis';


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
-- Name: user_briefings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_briefings (
    id integer NOT NULL,
    user_id integer NOT NULL,
    period character varying(20) DEFAULT 'weekly'::character varying,
    user_goals jsonb DEFAULT '{}'::jsonb,
    insights jsonb DEFAULT '{}'::jsonb,
    relevant_posts_count integer DEFAULT 0,
    total_posts_scraped integer DEFAULT 0,
    generated_at timestamp without time zone NOT NULL,
    sent_at timestamp without time zone,
    is_read boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: TABLE user_briefings; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.user_briefings IS 'Stores generated weekly career intelligence briefings for users';


--
-- Name: user_briefings_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.user_briefings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: user_briefings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.user_briefings_id_seq OWNED BY public.user_briefings.id;


--
-- Name: user_goals; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_goals (
    id integer NOT NULL,
    user_id integer NOT NULL,
    target_role character varying(200),
    target_companies text[],
    timeline_months integer,
    focus_areas text[],
    current_level character varying(50),
    is_active boolean DEFAULT true,
    progress_tracking jsonb DEFAULT '{}'::jsonb,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: TABLE user_goals; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.user_goals IS 'Stores user career goals for personalized job search and briefings';


--
-- Name: user_goals_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.user_goals_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: user_goals_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.user_goals_id_seq OWNED BY public.user_goals.id;


--
-- Name: user_workflows; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_workflows (
    id integer NOT NULL,
    user_id integer NOT NULL,
    name character varying(255) NOT NULL,
    workflow_json jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: user_workflows_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.user_workflows_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: user_workflows_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.user_workflows_id_seq OWNED BY public.user_workflows.id;


--
-- Name: v_interview_stats; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_interview_stats AS
 SELECT role_type,
    level,
    interview_stage,
    outcome,
    count(*) AS count,
    avg(confidence_score) AS avg_confidence,
    min(created_at) AS oldest_post,
    max(created_at) AS newest_post
   FROM public.scraped_posts
  WHERE (outcome IS NOT NULL)
  GROUP BY role_type, level, interview_stage, outcome;


--
-- Name: v_labeling_queue; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_labeling_queue AS
 SELECT id,
    post_id,
    title,
    subreddit,
    potential_outcome,
    confidence_score,
    role_type,
    level,
    (metadata ->> 'company'::text) AS company,
    created_at,
    scraped_at
   FROM public.scraped_posts
  WHERE ((labeling_status)::text = 'pending'::text)
  ORDER BY confidence_score DESC, scraped_at DESC;


--
-- Name: analysis_connections id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.analysis_connections ALTER COLUMN id SET DEFAULT nextval('public.analysis_connections_id_seq'::regclass);


--
-- Name: analysis_results id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.analysis_results ALTER COLUMN id SET DEFAULT nextval('public.analysis_results_id_seq'::regclass);


--
-- Name: assistant_conversations id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assistant_conversations ALTER COLUMN id SET DEFAULT nextval('public.assistant_conversations_id_seq'::regclass);


--
-- Name: assistant_messages id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assistant_messages ALTER COLUMN id SET DEFAULT nextval('public.assistant_messages_id_seq'::regclass);


--
-- Name: batch_analysis_cache id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.batch_analysis_cache ALTER COLUMN id SET DEFAULT nextval('public.batch_analysis_cache_id_seq'::regclass);


--
-- Name: benchmark_metadata id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.benchmark_metadata ALTER COLUMN id SET DEFAULT nextval('public.benchmark_metadata_id_seq'::regclass);


--
-- Name: benchmark_role_intelligence id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.benchmark_role_intelligence ALTER COLUMN id SET DEFAULT nextval('public.benchmark_role_intelligence_id_seq'::regclass);


--
-- Name: benchmark_stage_success id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.benchmark_stage_success ALTER COLUMN id SET DEFAULT nextval('public.benchmark_stage_success_id_seq'::regclass);


--
-- Name: company_level_mappings id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.company_level_mappings ALTER COLUMN id SET DEFAULT nextval('public.company_level_mappings_id_seq'::regclass);


--
-- Name: experience_analysis_history id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.experience_analysis_history ALTER COLUMN id SET DEFAULT nextval('public.experience_analysis_history_id_seq'::regclass);


--
-- Name: interview_questions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.interview_questions ALTER COLUMN id SET DEFAULT nextval('public.interview_questions_id_seq'::regclass);


--
-- Name: learning_map_resources id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.learning_map_resources ALTER COLUMN id SET DEFAULT nextval('public.learning_map_resources_id_seq'::regclass);


--
-- Name: learning_maps_history id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.learning_maps_history ALTER COLUMN id SET DEFAULT nextval('public.learning_maps_history_id_seq'::regclass);


--
-- Name: learning_topics id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.learning_topics ALTER COLUMN id SET DEFAULT nextval('public.learning_topics_id_seq'::regclass);


--
-- Name: leetcode_questions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.leetcode_questions ALTER COLUMN id SET DEFAULT nextval('public.leetcode_questions_id_seq'::regclass);


--
-- Name: level_mappings id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.level_mappings ALTER COLUMN id SET DEFAULT nextval('public.level_mappings_id_seq'::regclass);


--
-- Name: question_categories id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.question_categories ALTER COLUMN id SET DEFAULT nextval('public.question_categories_id_seq'::regclass);


--
-- Name: question_resources id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.question_resources ALTER COLUMN id SET DEFAULT nextval('public.question_resources_id_seq'::regclass);


--
-- Name: questions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.questions ALTER COLUMN id SET DEFAULT nextval('public.questions_id_seq'::regclass);


--
-- Name: role_types id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_types ALTER COLUMN id SET DEFAULT nextval('public.role_types_id_seq'::regclass);


--
-- Name: scraped_posts id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.scraped_posts ALTER COLUMN id SET DEFAULT nextval('public.scraped_posts_id_seq'::regclass);


--
-- Name: scraper_runs id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.scraper_runs ALTER COLUMN id SET DEFAULT nextval('public.scraper_runs_id_seq'::regclass);


--
-- Name: scraping_backfill_progress id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.scraping_backfill_progress ALTER COLUMN id SET DEFAULT nextval('public.scraping_backfill_progress_id_seq'::regclass);


--
-- Name: seed_post_markers id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.seed_post_markers ALTER COLUMN id SET DEFAULT nextval('public.seed_post_markers_id_seq'::regclass);


--
-- Name: stripe_events id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stripe_events ALTER COLUMN id SET DEFAULT nextval('public.stripe_events_id_seq'::regclass);


--
-- Name: usage_limits id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usage_limits ALTER COLUMN id SET DEFAULT nextval('public.usage_limits_id_seq'::regclass);


--
-- Name: user_briefings id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_briefings ALTER COLUMN id SET DEFAULT nextval('public.user_briefings_id_seq'::regclass);


--
-- Name: user_goals id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_goals ALTER COLUMN id SET DEFAULT nextval('public.user_goals_id_seq'::regclass);


--
-- Name: user_workflows id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_workflows ALTER COLUMN id SET DEFAULT nextval('public.user_workflows_id_seq'::regclass);


--
-- Name: analysis_connections analysis_connections_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.analysis_connections
    ADD CONSTRAINT analysis_connections_pkey PRIMARY KEY (id);


--
-- Name: analysis_connections analysis_connections_post1_id_post2_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.analysis_connections
    ADD CONSTRAINT analysis_connections_post1_id_post2_id_key UNIQUE (post1_id, post2_id);


--
-- Name: analysis_results analysis_results_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.analysis_results
    ADD CONSTRAINT analysis_results_pkey PRIMARY KEY (id);


--
-- Name: assistant_conversations assistant_conversations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assistant_conversations
    ADD CONSTRAINT assistant_conversations_pkey PRIMARY KEY (id);


--
-- Name: assistant_messages assistant_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assistant_messages
    ADD CONSTRAINT assistant_messages_pkey PRIMARY KEY (id);


--
-- Name: batch_analysis_cache batch_analysis_cache_batch_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.batch_analysis_cache
    ADD CONSTRAINT batch_analysis_cache_batch_id_key UNIQUE (batch_id);


--
-- Name: batch_analysis_cache batch_analysis_cache_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.batch_analysis_cache
    ADD CONSTRAINT batch_analysis_cache_pkey PRIMARY KEY (id);


--
-- Name: benchmark_metadata benchmark_metadata_cache_type_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.benchmark_metadata
    ADD CONSTRAINT benchmark_metadata_cache_type_key UNIQUE (cache_type);


--
-- Name: benchmark_metadata benchmark_metadata_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.benchmark_metadata
    ADD CONSTRAINT benchmark_metadata_pkey PRIMARY KEY (id);


--
-- Name: benchmark_role_intelligence benchmark_role_intelligence_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.benchmark_role_intelligence
    ADD CONSTRAINT benchmark_role_intelligence_pkey PRIMARY KEY (id);


--
-- Name: benchmark_role_intelligence benchmark_role_intelligence_role_type_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.benchmark_role_intelligence
    ADD CONSTRAINT benchmark_role_intelligence_role_type_key UNIQUE (role_type);


--
-- Name: benchmark_stage_success benchmark_stage_success_company_interview_stage_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.benchmark_stage_success
    ADD CONSTRAINT benchmark_stage_success_company_interview_stage_key UNIQUE (company, interview_stage);


--
-- Name: benchmark_stage_success benchmark_stage_success_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.benchmark_stage_success
    ADD CONSTRAINT benchmark_stage_success_pkey PRIMARY KEY (id);


--
-- Name: company_level_mappings company_level_mappings_company_standard_level_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.company_level_mappings
    ADD CONSTRAINT company_level_mappings_company_standard_level_key UNIQUE (company, standard_level);


--
-- Name: company_level_mappings company_level_mappings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.company_level_mappings
    ADD CONSTRAINT company_level_mappings_pkey PRIMARY KEY (id);


--
-- Name: experience_analysis_history experience_analysis_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.experience_analysis_history
    ADD CONSTRAINT experience_analysis_history_pkey PRIMARY KEY (id);


--
-- Name: interview_question_metadata interview_question_metadata_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.interview_question_metadata
    ADD CONSTRAINT interview_question_metadata_pkey PRIMARY KEY (question_id);


--
-- Name: interview_questions interview_questions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.interview_questions
    ADD CONSTRAINT interview_questions_pkey PRIMARY KEY (id);


--
-- Name: learning_map_resources learning_map_resources_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.learning_map_resources
    ADD CONSTRAINT learning_map_resources_name_key UNIQUE (name);


--
-- Name: learning_map_resources learning_map_resources_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.learning_map_resources
    ADD CONSTRAINT learning_map_resources_pkey PRIMARY KEY (id);


--
-- Name: learning_maps_history learning_maps_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.learning_maps_history
    ADD CONSTRAINT learning_maps_history_pkey PRIMARY KEY (id);


--
-- Name: learning_topics learning_topics_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.learning_topics
    ADD CONSTRAINT learning_topics_pkey PRIMARY KEY (id);


--
-- Name: learning_topics learning_topics_topic_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.learning_topics
    ADD CONSTRAINT learning_topics_topic_name_key UNIQUE (topic_name);


--
-- Name: leetcode_questions leetcode_questions_leetcode_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.leetcode_questions
    ADD CONSTRAINT leetcode_questions_leetcode_id_key UNIQUE (leetcode_id);


--
-- Name: leetcode_questions leetcode_questions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.leetcode_questions
    ADD CONSTRAINT leetcode_questions_pkey PRIMARY KEY (id);


--
-- Name: leetcode_questions leetcode_questions_title_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.leetcode_questions
    ADD CONSTRAINT leetcode_questions_title_slug_key UNIQUE (title_slug);


--
-- Name: level_mappings level_mappings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.level_mappings
    ADD CONSTRAINT level_mappings_pkey PRIMARY KEY (id);


--
-- Name: question_categories question_categories_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.question_categories
    ADD CONSTRAINT question_categories_name_key UNIQUE (name);


--
-- Name: question_categories question_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.question_categories
    ADD CONSTRAINT question_categories_pkey PRIMARY KEY (id);


--
-- Name: question_resources question_resources_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.question_resources
    ADD CONSTRAINT question_resources_pkey PRIMARY KEY (id);


--
-- Name: questions questions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.questions
    ADD CONSTRAINT questions_pkey PRIMARY KEY (id);


--
-- Name: role_types role_types_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_types
    ADD CONSTRAINT role_types_pkey PRIMARY KEY (id);


--
-- Name: role_types role_types_role_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_types
    ADD CONSTRAINT role_types_role_code_key UNIQUE (role_code);


--
-- Name: scraped_posts scraped_posts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.scraped_posts
    ADD CONSTRAINT scraped_posts_pkey PRIMARY KEY (id);


--
-- Name: scraped_posts scraped_posts_post_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.scraped_posts
    ADD CONSTRAINT scraped_posts_post_id_key UNIQUE (post_id);


--
-- Name: scraper_runs scraper_runs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.scraper_runs
    ADD CONSTRAINT scraper_runs_pkey PRIMARY KEY (id);


--
-- Name: scraping_backfill_progress scraping_backfill_progress_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.scraping_backfill_progress
    ADD CONSTRAINT scraping_backfill_progress_pkey PRIMARY KEY (id);


--
-- Name: scraping_backfill_progress scraping_backfill_progress_source_source_identifier_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.scraping_backfill_progress
    ADD CONSTRAINT scraping_backfill_progress_source_source_identifier_key UNIQUE (source, source_identifier);


--
-- Name: seed_post_markers seed_post_markers_batch_id_entity_type_entity_value_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.seed_post_markers
    ADD CONSTRAINT seed_post_markers_batch_id_entity_type_entity_value_key UNIQUE (batch_id, entity_type, entity_value);


--
-- Name: seed_post_markers seed_post_markers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.seed_post_markers
    ADD CONSTRAINT seed_post_markers_pkey PRIMARY KEY (id);


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
-- Name: interview_questions unique_post_question; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.interview_questions
    ADD CONSTRAINT unique_post_question UNIQUE (post_id, question_text);


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
-- Name: user_briefings user_briefings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_briefings
    ADD CONSTRAINT user_briefings_pkey PRIMARY KEY (id);


--
-- Name: user_goals user_goals_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_goals
    ADD CONSTRAINT user_goals_pkey PRIMARY KEY (id);


--
-- Name: user_workflows user_workflows_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_workflows
    ADD CONSTRAINT user_workflows_pkey PRIMARY KEY (id);


--
-- Name: idx_analysis_connections_post1; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_analysis_connections_post1 ON public.analysis_connections USING btree (post1_id);


--
-- Name: idx_analysis_connections_post2; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_analysis_connections_post2 ON public.analysis_connections USING btree (post2_id);


--
-- Name: idx_analysis_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_analysis_date ON public.experience_analysis_history USING btree (analyzed_at);


--
-- Name: idx_analysis_results_batch_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_analysis_results_batch_id ON public.analysis_results USING btree (batch_id);


--
-- Name: idx_analysis_results_company; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_analysis_results_company ON public.analysis_results USING btree (company);


--
-- Name: idx_analysis_results_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_analysis_results_created_at ON public.analysis_results USING btree (created_at);


--
-- Name: idx_analysis_results_experience_level; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_analysis_results_experience_level ON public.analysis_results USING btree (experience_level);


--
-- Name: idx_analysis_results_full_result; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_analysis_results_full_result ON public.analysis_results USING gin (full_result);


--
-- Name: idx_analysis_results_interview_stages; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_analysis_results_interview_stages ON public.analysis_results USING gin (interview_stages);


--
-- Name: idx_analysis_results_interview_topics; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_analysis_results_interview_topics ON public.analysis_results USING gin (interview_topics);


--
-- Name: idx_analysis_results_key_insights; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_analysis_results_key_insights ON public.analysis_results USING gin (key_insights);


--
-- Name: idx_analysis_results_metadata; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_analysis_results_metadata ON public.analysis_results USING gin (metadata);


--
-- Name: idx_analysis_results_outcome; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_analysis_results_outcome ON public.analysis_results USING btree (outcome);


--
-- Name: idx_analysis_results_preparation_materials; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_analysis_results_preparation_materials ON public.analysis_results USING gin (preparation_materials);


--
-- Name: idx_analysis_results_role; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_analysis_results_role ON public.analysis_results USING btree (role);


--
-- Name: idx_analysis_results_sentiment; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_analysis_results_sentiment ON public.analysis_results USING btree (sentiment);


--
-- Name: idx_analysis_results_user_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_analysis_results_user_created ON public.analysis_results USING btree (user_id, created_at DESC);


--
-- Name: idx_analysis_results_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_analysis_results_user_id ON public.analysis_results USING btree (user_id);


--
-- Name: idx_analysis_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_analysis_type ON public.experience_analysis_history USING btree (analysis_type);


--
-- Name: idx_analysis_user_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_analysis_user_date ON public.experience_analysis_history USING btree (analyzed_by_user_id, analyzed_at);


--
-- Name: idx_assistant_conversations_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_assistant_conversations_user_id ON public.assistant_conversations USING btree (user_id);


--
-- Name: idx_assistant_messages_conversation_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_assistant_messages_conversation_id ON public.assistant_messages USING btree (conversation_id);


--
-- Name: idx_backfill_source; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_backfill_source ON public.scraping_backfill_progress USING btree (source, source_identifier);


--
-- Name: idx_backfill_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_backfill_status ON public.scraping_backfill_progress USING btree (status);


--
-- Name: idx_batch_cache_batch_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_batch_cache_batch_id ON public.batch_analysis_cache USING btree (batch_id);


--
-- Name: idx_batch_cache_cached_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_batch_cache_cached_at ON public.batch_analysis_cache USING btree (cached_at DESC);


--
-- Name: idx_batch_cache_enhanced; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_batch_cache_enhanced ON public.batch_analysis_cache USING gin (enhanced_intelligence);


--
-- Name: idx_batch_cache_foundation_pool_size; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_batch_cache_foundation_pool_size ON public.batch_analysis_cache USING btree (foundation_pool_size);


--
-- Name: idx_batch_cache_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_batch_cache_user_id ON public.batch_analysis_cache USING btree (user_id);


--
-- Name: idx_benchmark_role_total_posts; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_benchmark_role_total_posts ON public.benchmark_role_intelligence USING btree (total_posts DESC);


--
-- Name: idx_benchmark_role_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_benchmark_role_type ON public.benchmark_role_intelligence USING btree (role_type);


--
-- Name: idx_benchmark_stage_company; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_benchmark_stage_company ON public.benchmark_stage_success USING btree (company);


--
-- Name: idx_benchmark_stage_stage; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_benchmark_stage_stage ON public.benchmark_stage_success USING btree (interview_stage);


--
-- Name: idx_benchmark_stage_success_rate; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_benchmark_stage_success_rate ON public.benchmark_stage_success USING btree (success_rate DESC);


--
-- Name: idx_company_sentiment; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_company_sentiment ON public.scraped_posts USING btree (((metadata ->> 'company'::text)), sentiment_category, sentiment_score) WHERE (sentiment_category IS NOT NULL);


--
-- Name: idx_compensation; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_compensation ON public.scraped_posts USING btree (((metadata ->> 'company'::text)), level, base_salary) WHERE (base_salary IS NOT NULL);


--
-- Name: idx_comprehensive_backfill_queue; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_comprehensive_backfill_queue ON public.scraped_posts USING btree (((metadata ->> 'company'::text)), backfill_analyzed_at, created_at DESC) WHERE ((is_relevant = true) AND (backfill_analyzed_at IS NULL));


--
-- Name: idx_connections_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_connections_created_at ON public.analysis_connections USING btree (created_at);


--
-- Name: idx_connections_post1_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_connections_post1_id ON public.analysis_connections USING btree (post1_id);


--
-- Name: idx_connections_post2_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_connections_post2_id ON public.analysis_connections USING btree (post2_id);


--
-- Name: idx_connections_strength; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_connections_strength ON public.analysis_connections USING btree (strength);


--
-- Name: idx_connections_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_connections_type ON public.analysis_connections USING btree (connection_type);


--
-- Name: idx_experience_outcome; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_experience_outcome ON public.scraped_posts USING btree (years_of_experience, outcome) WHERE (years_of_experience IS NOT NULL);


--
-- Name: idx_interview_performance; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_interview_performance ON public.scraped_posts USING btree (rounds_passed, total_rounds, outcome) WHERE (total_rounds IS NOT NULL);


--
-- Name: idx_interview_questions_company; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_interview_questions_company ON public.interview_questions USING btree (company);


--
-- Name: idx_interview_questions_difficulty; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_interview_questions_difficulty ON public.interview_questions USING btree (difficulty);


--
-- Name: idx_interview_questions_embedding_ivfflat; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_interview_questions_embedding_ivfflat ON public.interview_questions USING ivfflat (embedding public.vector_cosine_ops) WITH (lists='100');


--
-- Name: idx_interview_questions_estimated_time; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_interview_questions_estimated_time ON public.interview_questions USING btree (estimated_time_minutes);


--
-- Name: idx_interview_questions_llm_category; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_interview_questions_llm_category ON public.interview_questions USING btree (llm_category);


--
-- Name: idx_interview_questions_llm_difficulty; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_interview_questions_llm_difficulty ON public.interview_questions USING btree (llm_difficulty);


--
-- Name: idx_interview_questions_llm_extracted_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_interview_questions_llm_extracted_at ON public.interview_questions USING btree (llm_extracted_at);


--
-- Name: idx_interview_questions_post_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_interview_questions_post_id ON public.interview_questions USING btree (post_id);


--
-- Name: idx_interview_questions_role; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_interview_questions_role ON public.interview_questions USING btree (role_type, level);


--
-- Name: idx_interview_questions_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_interview_questions_type ON public.interview_questions USING btree (question_type);


--
-- Name: idx_learning_maps_crazy_plan; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_learning_maps_crazy_plan ON public.learning_maps_history USING btree (is_crazy_plan);


--
-- Name: idx_learning_maps_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_learning_maps_created_at ON public.learning_maps_history USING btree (created_at DESC);


--
-- Name: idx_learning_maps_improvement_areas; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_learning_maps_improvement_areas ON public.learning_maps_history USING gin (improvement_areas);


--
-- Name: idx_learning_maps_knowledge_gaps; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_learning_maps_knowledge_gaps ON public.learning_maps_history USING gin (knowledge_gaps);


--
-- Name: idx_learning_maps_pitfalls_narrative; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_learning_maps_pitfalls_narrative ON public.learning_maps_history USING gin (pitfalls_narrative);


--
-- Name: idx_learning_maps_skills_roadmap; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_learning_maps_skills_roadmap ON public.learning_maps_history USING gin (skills_roadmap);


--
-- Name: idx_learning_maps_source_report; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_learning_maps_source_report ON public.learning_maps_history USING btree (source_report_id);


--
-- Name: idx_learning_maps_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_learning_maps_status ON public.learning_maps_history USING btree (status);


--
-- Name: idx_learning_maps_timeline; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_learning_maps_timeline ON public.learning_maps_history USING gin (timeline);


--
-- Name: idx_learning_maps_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_learning_maps_user_id ON public.learning_maps_history USING btree (user_id);


--
-- Name: idx_learning_resources_companies; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_learning_resources_companies ON public.learning_map_resources USING gin (companies);


--
-- Name: idx_learning_resources_name; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_learning_resources_name ON public.learning_map_resources USING btree (name);


--
-- Name: idx_learning_resources_skills; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_learning_resources_skills ON public.learning_map_resources USING gin (skills);


--
-- Name: idx_learning_resources_success_rate; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_learning_resources_success_rate ON public.learning_map_resources USING btree (success_rate DESC);


--
-- Name: idx_learning_resources_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_learning_resources_type ON public.learning_map_resources USING btree (type);


--
-- Name: idx_learning_topics_category; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_learning_topics_category ON public.learning_topics USING btree (topic_category);


--
-- Name: idx_learning_topics_difficulty; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_learning_topics_difficulty ON public.learning_topics USING btree (difficulty_level);


--
-- Name: idx_learning_topics_embedding_ivfflat; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_learning_topics_embedding_ivfflat ON public.learning_topics USING ivfflat (embedding public.vector_cosine_ops) WITH (lists='50');


--
-- Name: idx_leetcode_difficulty; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_leetcode_difficulty ON public.leetcode_questions USING btree (difficulty);


--
-- Name: idx_leetcode_difficulty_numeric; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_leetcode_difficulty_numeric ON public.leetcode_questions USING btree (difficulty_numeric);


--
-- Name: idx_leetcode_frontend_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_leetcode_frontend_id ON public.leetcode_questions USING btree (frontend_id);


--
-- Name: idx_leetcode_title; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_leetcode_title ON public.leetcode_questions USING btree (title);


--
-- Name: idx_leetcode_title_slug; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_leetcode_title_slug ON public.leetcode_questions USING btree (title_slug);


--
-- Name: idx_metadata_backfill_queue; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_metadata_backfill_queue ON public.scraped_posts USING btree (((metadata ->> 'company'::text)), backfill_analyzed_at, created_at DESC) WHERE ((is_relevant = true) AND (backfill_analyzed_at IS NULL));


--
-- Name: idx_metadata_unanalyzed; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_metadata_unanalyzed ON public.scraped_posts USING btree (backfill_analyzed_at) WHERE ((backfill_analyzed_at IS NULL) AND (is_relevant = true) AND (body_text IS NOT NULL) AND (length(body_text) > 100));


--
-- Name: idx_prep_metrics; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_prep_metrics ON public.scraped_posts USING btree (prep_duration_weeks, leetcode_problems_solved, outcome) WHERE (prep_duration_weeks IS NOT NULL);


--
-- Name: idx_question_metadata_difficulty; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_question_metadata_difficulty ON public.interview_question_metadata USING btree (leetcode_difficulty);


--
-- Name: idx_question_metadata_leetcode; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_question_metadata_leetcode ON public.interview_question_metadata USING btree (leetcode_number);


--
-- Name: idx_question_metadata_tags; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_question_metadata_tags ON public.interview_question_metadata USING gin (topic_tags);


--
-- Name: idx_question_resources_question_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_question_resources_question_id ON public.question_resources USING btree (question_id);


--
-- Name: idx_questions_category_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_questions_category_id ON public.questions USING btree (category_id);


--
-- Name: idx_questions_difficulty; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_questions_difficulty ON public.questions USING btree (difficulty);


--
-- Name: idx_questions_is_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_questions_is_active ON public.questions USING btree (is_active);


--
-- Name: idx_referral_success; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_referral_success ON public.scraped_posts USING btree (is_referral, outcome) WHERE (is_referral IS NOT NULL);


--
-- Name: idx_scraped_posts_areas_struggled; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_scraped_posts_areas_struggled ON public.scraped_posts USING gin (areas_struggled);


--
-- Name: idx_scraped_posts_comments; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_scraped_posts_comments ON public.scraped_posts USING gin (comments);


--
-- Name: idx_scraped_posts_company_quarter; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_scraped_posts_company_quarter ON public.scraped_posts USING btree (((metadata ->> 'company'::text)), post_year_quarter) WHERE (post_year_quarter IS NOT NULL);


--
-- Name: idx_scraped_posts_company_role; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_scraped_posts_company_role ON public.scraped_posts USING btree (((metadata ->> 'company'::text)), role_type);


--
-- Name: idx_scraped_posts_compensation; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_scraped_posts_compensation ON public.scraped_posts USING gin (compensation);


--
-- Name: idx_scraped_posts_compensation_mentioned; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_scraped_posts_compensation_mentioned ON public.scraped_posts USING btree (compensation_mentioned);


--
-- Name: idx_scraped_posts_confidence; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_scraped_posts_confidence ON public.scraped_posts USING btree (confidence_score DESC);


--
-- Name: idx_scraped_posts_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_scraped_posts_created_at ON public.scraped_posts USING btree (created_at DESC);


--
-- Name: idx_scraped_posts_created_company; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_scraped_posts_created_company ON public.scraped_posts USING btree (created_at, ((metadata ->> 'company'::text)));


--
-- Name: idx_scraped_posts_created_level; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_scraped_posts_created_level ON public.scraped_posts USING btree (created_at, level);


--
-- Name: idx_scraped_posts_created_outcome; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_scraped_posts_created_outcome ON public.scraped_posts USING btree (created_at, outcome);


--
-- Name: idx_scraped_posts_difficulty_level; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_scraped_posts_difficulty_level ON public.scraped_posts USING btree (difficulty_level);


--
-- Name: idx_scraped_posts_embedding_ivfflat; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_scraped_posts_embedding_ivfflat ON public.scraped_posts USING ivfflat (embedding public.vector_cosine_ops) WITH (lists='100');


--
-- Name: INDEX idx_scraped_posts_embedding_ivfflat; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON INDEX public.idx_scraped_posts_embedding_ivfflat IS 'IVFFlat index for fast cosine similarity search on embeddings';


--
-- Name: idx_scraped_posts_embedding_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_scraped_posts_embedding_status ON public.scraped_posts USING btree (embedding_status) WHERE ((embedding_status)::text <> 'completed'::text);


--
-- Name: idx_scraped_posts_experience; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_scraped_posts_experience ON public.scraped_posts USING btree (experience_years);


--
-- Name: idx_scraped_posts_failed_questions; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_scraped_posts_failed_questions ON public.scraped_posts USING gin (failed_questions);


--
-- Name: idx_scraped_posts_frameworks; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_scraped_posts_frameworks ON public.scraped_posts USING gin (frameworks);


--
-- Name: idx_scraped_posts_interview_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_scraped_posts_interview_date ON public.scraped_posts USING btree (interview_date) WHERE (interview_date IS NOT NULL);


--
-- Name: idx_scraped_posts_interview_format; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_scraped_posts_interview_format ON public.scraped_posts USING btree (interview_format);


--
-- Name: idx_scraped_posts_interview_rounds; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_scraped_posts_interview_rounds ON public.scraped_posts USING btree (interview_rounds);


--
-- Name: idx_scraped_posts_interview_stage; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_scraped_posts_interview_stage ON public.scraped_posts USING btree (interview_stage);


--
-- Name: idx_scraped_posts_interview_topics; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_scraped_posts_interview_topics ON public.scraped_posts USING gin (interview_topics);


--
-- Name: idx_scraped_posts_is_relevant; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_scraped_posts_is_relevant ON public.scraped_posts USING btree (is_relevant);


--
-- Name: idx_scraped_posts_labeling_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_scraped_posts_labeling_status ON public.scraped_posts USING btree (labeling_status);


--
-- Name: idx_scraped_posts_level; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_scraped_posts_level ON public.scraped_posts USING btree (level);


--
-- Name: idx_scraped_posts_level_outcome; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_scraped_posts_level_outcome ON public.scraped_posts USING btree (level, outcome);


--
-- Name: idx_scraped_posts_llm_company; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_scraped_posts_llm_company ON public.scraped_posts USING btree (llm_company);


--
-- Name: idx_scraped_posts_llm_extracted_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_scraped_posts_llm_extracted_at ON public.scraped_posts USING btree (llm_extracted_at);


--
-- Name: idx_scraped_posts_llm_industry; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_scraped_posts_llm_industry ON public.scraped_posts USING btree (llm_industry);


--
-- Name: idx_scraped_posts_llm_outcome; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_scraped_posts_llm_outcome ON public.scraped_posts USING btree (llm_outcome);


--
-- Name: idx_scraped_posts_location; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_scraped_posts_location ON public.scraped_posts USING btree (location);


--
-- Name: idx_scraped_posts_location_gin; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_scraped_posts_location_gin ON public.scraped_posts USING gin (location);


--
-- Name: idx_scraped_posts_metadata; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_scraped_posts_metadata ON public.scraped_posts USING gin (metadata);


--
-- Name: idx_scraped_posts_mistakes_made; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_scraped_posts_mistakes_made ON public.scraped_posts USING gin (mistakes_made);


--
-- Name: idx_scraped_posts_offer_accepted; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_scraped_posts_offer_accepted ON public.scraped_posts USING btree (offer_accepted);


--
-- Name: idx_scraped_posts_outcome; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_scraped_posts_outcome ON public.scraped_posts USING btree (potential_outcome);


--
-- Name: idx_scraped_posts_prep_time; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_scraped_posts_prep_time ON public.scraped_posts USING btree (preparation_time_days);


--
-- Name: idx_scraped_posts_preparation; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_scraped_posts_preparation ON public.scraped_posts USING gin (preparation);


--
-- Name: idx_scraped_posts_referral_used; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_scraped_posts_referral_used ON public.scraped_posts USING btree (referral_used);


--
-- Name: idx_scraped_posts_relevance_source; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_scraped_posts_relevance_source ON public.scraped_posts USING btree (relevance_source);


--
-- Name: idx_scraped_posts_remote_or_onsite; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_scraped_posts_remote_or_onsite ON public.scraped_posts USING btree (remote_or_onsite);


--
-- Name: idx_scraped_posts_resources_used; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_scraped_posts_resources_used ON public.scraped_posts USING gin (resources_used);


--
-- Name: idx_scraped_posts_role_category; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_scraped_posts_role_category ON public.scraped_posts USING btree (role_category);


--
-- Name: idx_scraped_posts_role_level; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_scraped_posts_role_level ON public.scraped_posts USING btree (role_type, level);


--
-- Name: idx_scraped_posts_role_quarter; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_scraped_posts_role_quarter ON public.scraped_posts USING btree (role_type, post_year_quarter) WHERE (post_year_quarter IS NOT NULL);


--
-- Name: idx_scraped_posts_role_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_scraped_posts_role_type ON public.scraped_posts USING btree (role_type);


--
-- Name: idx_scraped_posts_scraped_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_scraped_posts_scraped_at ON public.scraped_posts USING btree (scraped_at DESC);


--
-- Name: idx_scraped_posts_sentiment_category; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_scraped_posts_sentiment_category ON public.scraped_posts USING btree (sentiment_category);


--
-- Name: idx_scraped_posts_skills_tested; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_scraped_posts_skills_tested ON public.scraped_posts USING gin (skills_tested);


--
-- Name: idx_scraped_posts_stage_outcome; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_scraped_posts_stage_outcome ON public.scraped_posts USING btree (interview_stage, outcome);


--
-- Name: idx_scraped_posts_subreddit; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_scraped_posts_subreddit ON public.scraped_posts USING btree (subreddit);


--
-- Name: idx_scraped_posts_success_factors; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_scraped_posts_success_factors ON public.scraped_posts USING gin (success_factors);


--
-- Name: idx_scraped_posts_tech_stack; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_scraped_posts_tech_stack ON public.scraped_posts USING gin (tech_stack);


--
-- Name: idx_scraped_posts_timeline; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_scraped_posts_timeline ON public.scraped_posts USING gin (timeline);


--
-- Name: idx_scraped_posts_title_embedding_ivfflat; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_scraped_posts_title_embedding_ivfflat ON public.scraped_posts USING ivfflat (title_embedding public.vector_cosine_ops) WITH (lists='100');


--
-- Name: idx_scraped_posts_tools; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_scraped_posts_tools ON public.scraped_posts USING gin (tools);


--
-- Name: idx_scraped_posts_total_rounds; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_scraped_posts_total_rounds ON public.scraped_posts USING btree (total_rounds);


--
-- Name: idx_scraped_posts_year_quarter; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_scraped_posts_year_quarter ON public.scraped_posts USING btree (post_year_quarter) WHERE (post_year_quarter IS NOT NULL);


--
-- Name: idx_scraper_runs_finished_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_scraper_runs_finished_at ON public.scraper_runs USING btree (finished_at DESC);


--
-- Name: idx_scraper_runs_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_scraper_runs_status ON public.scraper_runs USING btree (status);


--
-- Name: idx_seed_markers_batch; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_seed_markers_batch ON public.seed_post_markers USING btree (batch_id);


--
-- Name: idx_seed_markers_entity; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_seed_markers_entity ON public.seed_post_markers USING btree (entity_type, entity_value);


--
-- Name: idx_sentiment_analyzed; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sentiment_analyzed ON public.scraped_posts USING btree (sentiment_analyzed_at) WHERE (sentiment_analyzed_at IS NOT NULL);


--
-- Name: idx_sentiment_category; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sentiment_category ON public.scraped_posts USING btree (sentiment_category) WHERE (sentiment_category IS NOT NULL);


--
-- Name: idx_sentiment_score; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sentiment_score ON public.scraped_posts USING btree (sentiment_score) WHERE (sentiment_score IS NOT NULL);


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
-- Name: idx_unanalyzed_posts; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_unanalyzed_posts ON public.scraped_posts USING btree (created_at DESC) WHERE ((sentiment_category IS NULL) AND (body_text IS NOT NULL) AND (length(body_text) > 100));


--
-- Name: idx_user_briefings_generated_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_briefings_generated_at ON public.user_briefings USING btree (generated_at DESC);


--
-- Name: idx_user_briefings_is_read; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_briefings_is_read ON public.user_briefings USING btree (is_read);


--
-- Name: idx_user_briefings_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_briefings_user_id ON public.user_briefings USING btree (user_id);


--
-- Name: idx_user_goals_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_goals_active ON public.user_goals USING btree (is_active);


--
-- Name: idx_user_goals_focus_areas; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_goals_focus_areas ON public.user_goals USING gin (focus_areas);


--
-- Name: idx_user_goals_target_companies; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_goals_target_companies ON public.user_goals USING gin (target_companies);


--
-- Name: idx_user_goals_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_goals_user_id ON public.user_goals USING btree (user_id);


--
-- Name: idx_user_workflows_updated_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_workflows_updated_at ON public.user_workflows USING btree (updated_at DESC);


--
-- Name: idx_user_workflows_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_workflows_user_id ON public.user_workflows USING btree (user_id);


--
-- Name: learning_maps_history learning_maps_updated_at_trigger; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER learning_maps_updated_at_trigger BEFORE UPDATE ON public.learning_maps_history FOR EACH ROW EXECUTE FUNCTION public.update_learning_maps_updated_at();


--
-- Name: assistant_conversations trg_assistant_conversations_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_assistant_conversations_updated_at BEFORE UPDATE ON public.assistant_conversations FOR EACH ROW EXECUTE FUNCTION public.update_assistant_conversations_updated_at();


--
-- Name: user_workflows trg_user_workflows_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_user_workflows_updated_at BEFORE UPDATE ON public.user_workflows FOR EACH ROW EXECUTE FUNCTION public.update_user_workflows_updated_at();


--
-- Name: scraped_posts update_scraped_posts_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_scraped_posts_updated_at BEFORE UPDATE ON public.scraped_posts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: user_goals update_user_goals_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_user_goals_updated_at BEFORE UPDATE ON public.user_goals FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: analysis_connections analysis_connections_post1_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.analysis_connections
    ADD CONSTRAINT analysis_connections_post1_id_fkey FOREIGN KEY (post1_id) REFERENCES public.analysis_results(id) ON DELETE CASCADE;


--
-- Name: analysis_connections analysis_connections_post2_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.analysis_connections
    ADD CONSTRAINT analysis_connections_post2_id_fkey FOREIGN KEY (post2_id) REFERENCES public.analysis_results(id) ON DELETE CASCADE;


--
-- Name: assistant_messages assistant_messages_conversation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assistant_messages
    ADD CONSTRAINT assistant_messages_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.assistant_conversations(id) ON DELETE CASCADE;


--
-- Name: interview_question_metadata interview_question_metadata_question_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.interview_question_metadata
    ADD CONSTRAINT interview_question_metadata_question_id_fkey FOREIGN KEY (question_id) REFERENCES public.interview_questions(id) ON DELETE CASCADE;


--
-- Name: interview_questions interview_questions_post_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.interview_questions
    ADD CONSTRAINT interview_questions_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.scraped_posts(post_id);


--
-- Name: question_categories question_categories_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.question_categories
    ADD CONSTRAINT question_categories_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.question_categories(id);


--
-- Name: question_resources question_resources_question_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.question_resources
    ADD CONSTRAINT question_resources_question_id_fkey FOREIGN KEY (question_id) REFERENCES public.questions(id) ON DELETE CASCADE;


--
-- Name: questions questions_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.questions
    ADD CONSTRAINT questions_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.question_categories(id);


--
-- PostgreSQL database dump complete
--

\unrestrict suaWzOajfW08V7OuquIi5zDRKQxki2yU0SEmYMyeCfYzrMMYKqSdXiOBN1WAeqm

