--
-- PostgreSQL database dump
--

\restrict XEQ5icdQSLMiiZIFxNPUINAprGSID8EcConBjyMDE5yiSv32l3qWTVycmdeGtTK

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
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.users (id, email, password_hash, first_name, last_name, role, status, created_at, updated_at, google_id, display_name, avatar_url, last_login, is_active, linkedin_url, email_verified, verification_token, verification_token_expires, password_reset_token, password_reset_expires, reset_token, reset_token_expires, recovery_email, stripe_customer_id, stripe_subscription_id, subscription_tier, subscription_status, subscription_period_start, subscription_period_end, trial_ends_at) FROM stdin;
24	test@example.com	$2b$12$HBu44g.wpjIC8Y0DtQ5YhuAeCTF7YFecflo6fpdRojFoVCx5R0PTy	\N	\N	candidate	active	2025-11-30 01:28:20.611766	2025-11-30 01:28:20.611766	\N	Test User	\N	\N	t	\N	f	81d45ab2f601bfe9622e2ae84e063b01f7a8f5216182f05fe11bfd702c8e7bc1	2025-12-01 01:28:20.662	\N	\N	\N	\N	\N	\N	\N	free	inactive	\N	\N	\N
25	729714389@qq.com	$2b$12$Mvne.KtDelkbNWGXk69A7eU6paEsHkpJ/0WtKPSkFsZTXKlYln8WS	\N	\N	candidate	active	2025-11-30 01:46:11.471193	2025-11-30 02:03:07.966854	\N	capybara	\N	2025-11-30 02:03:07.966854	t	\N	f	1c324a540f65a3de56b1da1fa95ae6939f210a01b25276678296ae6db611688a	2025-12-01 01:46:11.493	\N	\N	\N	\N	\N	\N	\N	free	inactive	\N	\N	\N
23	elaine12yang@gmail.com	\N	Elaine	Yang	candidate	active	2025-11-30 01:04:21.889945	2025-11-30 16:35:59.310782	109077479899324908419	Elaine Yang	https://lh3.googleusercontent.com/a/ACg8ocIIoAWzbEREp846ie7InKBYp7bddkq_5jMS9xxBNq7mZvNKJA=s96-c	2025-11-30 16:35:59.310782	t	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	free	inactive	\N	\N	\N
2	lingyi.luan01@gmail.com	\N	Lingyi	Luan	candidate	active	2025-10-29 18:52:54.896775	2025-11-30 16:38:17.119733	103975432553934211357	Lingyi Luan	https://lh3.googleusercontent.com/a/ACg8ocJ6rJctsK7-AcoseX0WuMGeJ24y7au4fvk3ozicOpKvh18ukA=s96-c	2025-11-30 16:38:17.119733	t	\N	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	free	inactive	\N	\N	\N
19	test-user-001@gmail.com	$2b$12$dSt18CKWRirnnYKQJ5Sdk.jq7EBFM8Nm5LjttNjJP59sniGn1PwYO	\N	\N	candidate	active	2025-11-27 16:58:58.188853	2025-11-27 16:59:15.548822	\N	Test User	\N	2025-11-27 16:59:15.548822	t	\N	f	0c79a3043e025d7d39c0187344d13b214c0743243a393d75d1c8d0858a4a2f49	2025-11-28 16:58:58.213	\N	\N	\N	\N	\N	\N	\N	free	inactive	\N	\N	\N
1	L01Mi@outlook.com	$2b$12$3W0PgPJn048SKVyJMbSZou5L49Eb8BNqgj7Jl4NEX9T5vLDBLi5J2	Lingyi	\N	candidate	active	2025-10-26 20:51:30.229431	2025-11-30 19:05:02.508879	100414766976273469776	Riley	https://lh3.googleusercontent.com/a/ACg8ocJHOGMtIUqeRAu08X9UmuLhkInTV3ibsbN6WRgBasHJpg55Hg=s96-c	2025-11-30 19:05:02.508879	t	https://www.linkedin.com/in/4oYairNtLq	t	\N	\N	\N	\N	acefb2153e67d85d0c8577035e0e940b1ef224f5fd59e7262eaadffae61d18a1	2025-11-29 01:18:59.358	\N	\N	\N	free	inactive	\N	\N	\N
20	test-user-002@gmail.com	$2b$12$9YLD4NyRv80/vt/laC0ANeR5D1YZAl0Vk1TSI74cdByf9EBr2Gzbq	\N	\N	candidate	active	2025-11-27 17:02:30.594422	2025-11-27 17:02:50.0688	\N	Test User 2	\N	2025-11-27 17:02:50.0688	t	\N	f	ad097e14d31c9e7a5b779615dd2b24041ebb62a1c76876fea36d9c2d71801c3f	2025-11-28 17:02:30.599	\N	\N	\N	\N	\N	\N	\N	free	inactive	\N	\N	\N
21	test-user-003@gmail.com	$2b$12$sR73HqJwch6GvBolPg.6leB1PKACiuyPQq5c3eZR3/oE0e4asxzPu	\N	\N	candidate	active	2025-11-27 17:43:50.393139	2025-11-27 17:43:50.393139	\N	Test User 3	\N	\N	t	\N	f	2347f7fcc0ce82e632e6dcf92ac634c48bcf7305c56d73d226046adc8cde778f	2025-11-28 17:43:50.489	\N	\N	\N	\N	\N	\N	\N	free	inactive	\N	\N	\N
18	ll06128n@pace.edu	$2b$12$5WdJsX8dxLmnv6/6F1UHCe0pv2GcsWytmecQuEOCHVhEEpA3Zqm7e	\N	\N	candidate	active	2025-11-27 04:18:26.371244	2025-11-27 05:55:38.680539	\N	Riley1	\N	2025-11-27 05:55:38.680539	t	\N	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	free	inactive	\N	\N	\N
22	sync-test-user@gmail.com	$2b$12$qpnP5IkqzgnbGL8QT5ux4OHTTPBJOobCNVX90Mj8qWIm1F1whTlJC	\N	\N	candidate	active	2025-11-27 17:44:00.105727	2025-11-27 17:44:00.105727	\N	Sync Test User	\N	\N	t	\N	f	fbfe79dd8b7856e749aa011fba8316a8fb5658df293ba51518a5fd500d3ff8d5	2025-11-28 17:44:00.123	\N	\N	\N	\N	\N	\N	\N	free	inactive	\N	\N	\N
\.


--
-- Data for Name: email_verification_tokens; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.email_verification_tokens (id, user_id, token, expires_at, created_at) FROM stdin;
\.


--
-- Data for Name: lemon_squeezy_events; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.lemon_squeezy_events (id, event_id, event_type, event_data, processed, retry_count, error_message, created_at, processed_at) FROM stdin;
1	subscription_created_1764283465271	subscription_created	{"data": {"id": "1674641", "type": "subscriptions", "links": {"self": "https://api.lemonsqueezy.com/v1/subscriptions/1674641"}, "attributes": {"urls": {"customer_portal": "https://interview-intel.lemonsqueezy.com/billing?expires=1764300912&test_mode=1&user=6031992&signature=75a7548e1cb4b2e1482dbc120c158278709763ef5be05aaaa571b055a3d84084", "update_payment_method": "https://interview-intel.lemonsqueezy.com/subscription/1674641/payment-details?expires=1764300912&signature=2da41f2df5c3c3abcd93b6eea9ba374f5564756febadd6d92b29be4eb9573a68", "customer_portal_update_subscription": "https://interview-intel.lemonsqueezy.com/billing/1674641/update?expires=1764300912&user=6031992&signature=ca55ef2262a4f5fd7ca6bf070f116fb2e96dfa7305816a35561ae130634b7cbf"}, "pause": null, "status": "active", "ends_at": null, "order_id": 6922210, "store_id": 249054, "cancelled": false, "renews_at": "2025-12-27T21:34:04.000000Z", "test_mode": true, "user_name": "Lingyi", "card_brand": "visa", "created_at": "2025-11-27T21:34:06.000000Z", "product_id": 708718, "updated_at": "2025-11-27T21:35:12.000000Z", "user_email": "L01Mi@outlook.com", "variant_id": 1115451, "customer_id": 7238231, "product_name": "Interview Intel Pro", "variant_name": "Pro Monthly", "order_item_id": 6862308, "trial_ends_at": null, "billing_anchor": 27, "card_last_four": "4242", "status_formatted": "Active", "payment_processor": "stripe", "first_subscription_item": {"id": 5520826, "price_id": 1835146, "quantity": 1, "created_at": "2025-11-27T21:35:12.000000Z", "updated_at": "2025-11-27T21:35:12.000000Z", "is_usage_based": false, "subscription_id": 1674641}}, "relationships": {"order": {"links": {"self": "https://api.lemonsqueezy.com/v1/subscriptions/1674641/relationships/order", "related": "https://api.lemonsqueezy.com/v1/subscriptions/1674641/order"}}, "store": {"links": {"self": "https://api.lemonsqueezy.com/v1/subscriptions/1674641/relationships/store", "related": "https://api.lemonsqueezy.com/v1/subscriptions/1674641/store"}}, "product": {"links": {"self": "https://api.lemonsqueezy.com/v1/subscriptions/1674641/relationships/product", "related": "https://api.lemonsqueezy.com/v1/subscriptions/1674641/product"}}, "variant": {"links": {"self": "https://api.lemonsqueezy.com/v1/subscriptions/1674641/relationships/variant", "related": "https://api.lemonsqueezy.com/v1/subscriptions/1674641/variant"}}, "customer": {"links": {"self": "https://api.lemonsqueezy.com/v1/subscriptions/1674641/relationships/customer", "related": "https://api.lemonsqueezy.com/v1/subscriptions/1674641/customer"}}, "order-item": {"links": {"self": "https://api.lemonsqueezy.com/v1/subscriptions/1674641/relationships/order-item", "related": "https://api.lemonsqueezy.com/v1/subscriptions/1674641/order-item"}}, "subscription-items": {"links": {"self": "https://api.lemonsqueezy.com/v1/subscriptions/1674641/relationships/subscription-items", "related": "https://api.lemonsqueezy.com/v1/subscriptions/1674641/subscription-items"}}, "subscription-invoices": {"links": {"self": "https://api.lemonsqueezy.com/v1/subscriptions/1674641/relationships/subscription-invoices", "related": "https://api.lemonsqueezy.com/v1/subscriptions/1674641/subscription-invoices"}}}}, "meta": {"test_mode": true, "event_name": "subscription_created", "webhook_id": "b280274a-1932-48a8-bc0d-7795b2e32d81"}}	t	0	\N	2025-11-27 22:44:25.303798	2025-11-27 22:44:25.311666
2	subscription_created_1764284116435	subscription_created	{"data": {"id": "1674641", "type": "subscriptions", "links": {"self": "https://api.lemonsqueezy.com/v1/subscriptions/1674641"}, "attributes": {"urls": {"customer_portal": "https://interview-intel.lemonsqueezy.com/billing?expires=1764300912&test_mode=1&user=6031992&signature=75a7548e1cb4b2e1482dbc120c158278709763ef5be05aaaa571b055a3d84084", "update_payment_method": "https://interview-intel.lemonsqueezy.com/subscription/1674641/payment-details?expires=1764300912&signature=2da41f2df5c3c3abcd93b6eea9ba374f5564756febadd6d92b29be4eb9573a68", "customer_portal_update_subscription": "https://interview-intel.lemonsqueezy.com/billing/1674641/update?expires=1764300912&user=6031992&signature=ca55ef2262a4f5fd7ca6bf070f116fb2e96dfa7305816a35561ae130634b7cbf"}, "pause": null, "status": "active", "ends_at": null, "order_id": 6922210, "store_id": 249054, "cancelled": false, "renews_at": "2025-12-27T21:34:04.000000Z", "test_mode": true, "user_name": "Lingyi", "card_brand": "visa", "created_at": "2025-11-27T21:34:06.000000Z", "product_id": 708718, "updated_at": "2025-11-27T21:35:12.000000Z", "user_email": "L01Mi@outlook.com", "variant_id": 1115451, "customer_id": 7238231, "product_name": "Interview Intel Pro", "variant_name": "Pro Monthly", "order_item_id": 6862308, "trial_ends_at": null, "billing_anchor": 27, "card_last_four": "4242", "status_formatted": "Active", "payment_processor": "stripe", "first_subscription_item": {"id": 5520826, "price_id": 1835146, "quantity": 1, "created_at": "2025-11-27T21:35:12.000000Z", "updated_at": "2025-11-27T21:35:12.000000Z", "is_usage_based": false, "subscription_id": 1674641}}, "relationships": {"order": {"links": {"self": "https://api.lemonsqueezy.com/v1/subscriptions/1674641/relationships/order", "related": "https://api.lemonsqueezy.com/v1/subscriptions/1674641/order"}}, "store": {"links": {"self": "https://api.lemonsqueezy.com/v1/subscriptions/1674641/relationships/store", "related": "https://api.lemonsqueezy.com/v1/subscriptions/1674641/store"}}, "product": {"links": {"self": "https://api.lemonsqueezy.com/v1/subscriptions/1674641/relationships/product", "related": "https://api.lemonsqueezy.com/v1/subscriptions/1674641/product"}}, "variant": {"links": {"self": "https://api.lemonsqueezy.com/v1/subscriptions/1674641/relationships/variant", "related": "https://api.lemonsqueezy.com/v1/subscriptions/1674641/variant"}}, "customer": {"links": {"self": "https://api.lemonsqueezy.com/v1/subscriptions/1674641/relationships/customer", "related": "https://api.lemonsqueezy.com/v1/subscriptions/1674641/customer"}}, "order-item": {"links": {"self": "https://api.lemonsqueezy.com/v1/subscriptions/1674641/relationships/order-item", "related": "https://api.lemonsqueezy.com/v1/subscriptions/1674641/order-item"}}, "subscription-items": {"links": {"self": "https://api.lemonsqueezy.com/v1/subscriptions/1674641/relationships/subscription-items", "related": "https://api.lemonsqueezy.com/v1/subscriptions/1674641/subscription-items"}}, "subscription-invoices": {"links": {"self": "https://api.lemonsqueezy.com/v1/subscriptions/1674641/relationships/subscription-invoices", "related": "https://api.lemonsqueezy.com/v1/subscriptions/1674641/subscription-invoices"}}}}, "meta": {"test_mode": true, "event_name": "subscription_created", "webhook_id": "361ce102-3380-43b1-baec-d92c2898603b"}}	t	0	\N	2025-11-27 22:55:16.482081	2025-11-27 22:55:16.48841
\.


--
-- Data for Name: password_reset_attempts; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.password_reset_attempts (id, email, ip_address, attempted_at, success, created_at) FROM stdin;
1	default@example.com	172.66.154.160	2025-11-27 05:38:47.81059	f	2025-11-27 05:38:47.81059
2	ll06128n@pace.edu	172.66.154.160	2025-11-27 05:40:26.979207	t	2025-11-27 05:40:26.979207
3	l01mi@outlook.com	172.66.154.160	2025-11-27 05:42:54.734908	t	2025-11-27 05:42:54.734908
4	l01mi@outlook.com	172.66.154.160	2025-11-27 05:45:07.691255	t	2025-11-27 05:45:07.691255
5	ll06128n@pace.edu	172.66.154.160	2025-11-27 05:54:57.082959	t	2025-11-27 05:54:57.082959
6	test@example.com	172.66.154.160	2025-11-28 00:54:26.477162	f	2025-11-28 00:54:26.477162
7	l01mi@outlook.com	172.66.154.160	2025-11-28 01:18:59.234886	t	2025-11-28 01:18:59.234886
\.


--
-- Data for Name: subscriptions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.subscriptions (id, user_id, stripe_subscription_id, stripe_customer_id, stripe_price_id, tier, billing_interval, status, amount_cents, currency, current_period_start, current_period_end, trial_start, trial_end, canceled_at, ended_at, created_at, updated_at, ls_subscription_id, ls_customer_id, ls_variant_id, cancel_at_period_end) FROM stdin;
\.


--
-- Data for Name: payment_transactions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.payment_transactions (id, user_id, subscription_id, stripe_payment_intent_id, stripe_invoice_id, stripe_charge_id, amount_cents, currency, status, payment_method_type, payment_method_last4, payment_method_brand, paid_at, refunded_at, created_at, updated_at, description, failure_reason) FROM stdin;
\.


--
-- Data for Name: stripe_events; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.stripe_events (id, stripe_event_id, event_type, api_version, data, processed, processed_at, error_message, retry_count, created_at) FROM stdin;
\.


--
-- Data for Name: usage_limits; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.usage_limits (id, tier, analyses_per_month, learning_maps_per_month, batch_analyses_per_month, api_access, priority_support, data_export, custom_branding, created_at, updated_at) FROM stdin;
1	free	5	2	0	f	f	f	f	2025-11-27 22:29:59.761906	2025-11-27 22:29:59.761906
2	pro	15	10	5	f	t	f	f	2025-11-27 22:29:59.761906	2025-11-27 22:29:59.761906
3	premium	-1	-1	-1	t	t	t	f	2025-11-27 22:29:59.761906	2025-11-27 22:29:59.761906
\.


--
-- Data for Name: usage_tracking; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.usage_tracking (id, user_id, resource_type, usage_count, period_start, period_end, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: user_preferences; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.user_preferences (id, user_id, theme, language, notification_settings, dashboard_layout, created_at, updated_at, email_notifications, weekly_digest) FROM stdin;
1	1	dark	en	{}	{}	2025-11-28 01:53:57.416354	2025-11-28 01:55:03.772198	t	t
\.


--
-- Data for Name: user_profiles; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.user_profiles (id, user_id, bio, skills, experience_level, resume_url, linkedin_url, github_url, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: user_sessions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.user_sessions (id, user_id, session_token, expires_at, created_at, ip_address, user_agent) FROM stdin;
\.


--
-- Name: lemon_squeezy_events_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.lemon_squeezy_events_id_seq', 2, true);


--
-- Name: password_reset_attempts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.password_reset_attempts_id_seq', 7, true);


--
-- Name: payment_transactions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.payment_transactions_id_seq', 1, false);


--
-- Name: stripe_events_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.stripe_events_id_seq', 1, false);


--
-- Name: subscriptions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.subscriptions_id_seq', 1, false);


--
-- Name: usage_limits_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.usage_limits_id_seq', 3, true);


--
-- Name: usage_tracking_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.usage_tracking_id_seq', 1, false);


--
-- Name: user_preferences_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.user_preferences_id_seq', 15, true);


--
-- Name: user_profiles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.user_profiles_id_seq', 1, false);


--
-- Name: user_sessions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.user_sessions_id_seq', 1, false);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.users_id_seq', 25, true);


--
-- PostgreSQL database dump complete
--

\unrestrict XEQ5icdQSLMiiZIFxNPUINAprGSID8EcConBjyMDE5yiSv32l3qWTVycmdeGtTK

