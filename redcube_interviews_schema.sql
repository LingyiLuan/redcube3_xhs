--
-- PostgreSQL database dump
--

\restrict PFDU9gCUc2uvsDteBzgOpNwhbjn9mlabbBnOrngloBZ0HmsdIV7Ivd5MuTkIO3X

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

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: interview_feedback; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.interview_feedback (
    id integer NOT NULL,
    interview_id integer,
    overall_score integer,
    technical_score integer,
    communication_score integer,
    problem_solving_score integer,
    comments text,
    recommendation character varying(50),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT interview_feedback_communication_score_check CHECK (((communication_score >= 0) AND (communication_score <= 10))),
    CONSTRAINT interview_feedback_overall_score_check CHECK (((overall_score >= 0) AND (overall_score <= 10))),
    CONSTRAINT interview_feedback_problem_solving_score_check CHECK (((problem_solving_score >= 0) AND (problem_solving_score <= 10))),
    CONSTRAINT interview_feedback_technical_score_check CHECK (((technical_score >= 0) AND (technical_score <= 10)))
);


--
-- Name: interview_feedback_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.interview_feedback_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: interview_feedback_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.interview_feedback_id_seq OWNED BY public.interview_feedback.id;


--
-- Name: interview_questions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.interview_questions (
    id integer NOT NULL,
    interview_id integer,
    question_text text NOT NULL,
    question_type character varying(50) NOT NULL,
    difficulty character varying(20) DEFAULT 'medium'::character varying,
    category character varying(100),
    answer text,
    score integer,
    feedback text,
    time_spent_minutes integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT interview_questions_score_check CHECK (((score >= 0) AND (score <= 10)))
);


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
-- Name: interviews; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.interviews (
    id integer NOT NULL,
    candidate_id integer NOT NULL,
    interviewer_id integer NOT NULL,
    "position" character varying(200) NOT NULL,
    status character varying(50) DEFAULT 'scheduled'::character varying,
    interview_type character varying(50) NOT NULL,
    scheduled_at timestamp without time zone NOT NULL,
    duration_minutes integer DEFAULT 60,
    meeting_url character varying(500),
    notes text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: interviews_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.interviews_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: interviews_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.interviews_id_seq OWNED BY public.interviews.id;


--
-- Name: interview_feedback id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.interview_feedback ALTER COLUMN id SET DEFAULT nextval('public.interview_feedback_id_seq'::regclass);


--
-- Name: interview_questions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.interview_questions ALTER COLUMN id SET DEFAULT nextval('public.interview_questions_id_seq'::regclass);


--
-- Name: interviews id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.interviews ALTER COLUMN id SET DEFAULT nextval('public.interviews_id_seq'::regclass);


--
-- Name: interview_feedback interview_feedback_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.interview_feedback
    ADD CONSTRAINT interview_feedback_pkey PRIMARY KEY (id);


--
-- Name: interview_questions interview_questions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.interview_questions
    ADD CONSTRAINT interview_questions_pkey PRIMARY KEY (id);


--
-- Name: interviews interviews_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.interviews
    ADD CONSTRAINT interviews_pkey PRIMARY KEY (id);


--
-- Name: idx_interview_feedback_interview_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_interview_feedback_interview_id ON public.interview_feedback USING btree (interview_id);


--
-- Name: idx_interview_questions_interview_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_interview_questions_interview_id ON public.interview_questions USING btree (interview_id);


--
-- Name: idx_interviews_candidate_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_interviews_candidate_id ON public.interviews USING btree (candidate_id);


--
-- Name: idx_interviews_interviewer_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_interviews_interviewer_id ON public.interviews USING btree (interviewer_id);


--
-- Name: idx_interviews_scheduled_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_interviews_scheduled_at ON public.interviews USING btree (scheduled_at);


--
-- Name: interview_feedback interview_feedback_interview_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.interview_feedback
    ADD CONSTRAINT interview_feedback_interview_id_fkey FOREIGN KEY (interview_id) REFERENCES public.interviews(id) ON DELETE CASCADE;


--
-- Name: interview_questions interview_questions_interview_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.interview_questions
    ADD CONSTRAINT interview_questions_interview_id_fkey FOREIGN KEY (interview_id) REFERENCES public.interviews(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict PFDU9gCUc2uvsDteBzgOpNwhbjn9mlabbBnOrngloBZ0HmsdIV7Ivd5MuTkIO3X

