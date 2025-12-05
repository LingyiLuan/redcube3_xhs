--
-- PostgreSQL database dump
--

\restrict uPDnETtguSrOK0Kj8lqXHllpZqUTHrkjThLcP5Iyod5cTO05HCfBvOddh8jTzyN

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
-- Data for Name: interviews; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.interviews (id, candidate_id, interviewer_id, "position", status, interview_type, scheduled_at, duration_minutes, meeting_url, notes, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: interview_feedback; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.interview_feedback (id, interview_id, overall_score, technical_score, communication_score, problem_solving_score, comments, recommendation, created_at) FROM stdin;
\.


--
-- Data for Name: interview_questions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.interview_questions (id, interview_id, question_text, question_type, difficulty, category, answer, score, feedback, time_spent_minutes, created_at) FROM stdin;
\.


--
-- Name: interview_feedback_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.interview_feedback_id_seq', 1, false);


--
-- Name: interview_questions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.interview_questions_id_seq', 1, false);


--
-- Name: interviews_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.interviews_id_seq', 1, false);


--
-- PostgreSQL database dump complete
--

\unrestrict uPDnETtguSrOK0Kj8lqXHllpZqUTHrkjThLcP5Iyod5cTO05HCfBvOddh8jTzyN

