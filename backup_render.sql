--
-- PostgreSQL database dump
--

\restrict GIdCq3qAKeZrsPhfq77esaGNjgKpahBobV4FouJ89lyebVpJVVchKEZQfo0WaF0

-- Dumped from database version 18.1 (Debian 18.1-1.pgdg12+2)
-- Dumped by pg_dump version 18.1 (Homebrew)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: parvoshub_user
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO parvoshub_user;

--
-- Name: pg_stat_statements; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pg_stat_statements WITH SCHEMA public;


--
-- Name: EXTENSION pg_stat_statements; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pg_stat_statements IS 'track planning and execution statistics of all SQL statements executed';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: calendar_events; Type: TABLE; Schema: public; Owner: parvoshub_user
--

CREATE TABLE public.calendar_events (
    id integer NOT NULL,
    nombre text NOT NULL,
    dia_mes integer NOT NULL,
    cantidad_min real NOT NULL,
    cantidad_max real,
    categoria text NOT NULL,
    recurrencia jsonb NOT NULL,
    activo boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT calendar_events_dia_mes_check CHECK (((dia_mes >= 1) AND (dia_mes <= 31)))
);


ALTER TABLE public.calendar_events OWNER TO parvoshub_user;

--
-- Name: calendar_events_id_seq; Type: SEQUENCE; Schema: public; Owner: parvoshub_user
--

CREATE SEQUENCE public.calendar_events_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.calendar_events_id_seq OWNER TO parvoshub_user;

--
-- Name: calendar_events_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: parvoshub_user
--

ALTER SEQUENCE public.calendar_events_id_seq OWNED BY public.calendar_events.id;


--
-- Name: dismissed_warnings; Type: TABLE; Schema: public; Owner: parvoshub_user
--

CREATE TABLE public.dismissed_warnings (
    id integer NOT NULL,
    evento_id integer NOT NULL,
    mes_ano text NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.dismissed_warnings OWNER TO parvoshub_user;

--
-- Name: dismissed_warnings_id_seq; Type: SEQUENCE; Schema: public; Owner: parvoshub_user
--

CREATE SEQUENCE public.dismissed_warnings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.dismissed_warnings_id_seq OWNER TO parvoshub_user;

--
-- Name: dismissed_warnings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: parvoshub_user
--

ALTER SEQUENCE public.dismissed_warnings_id_seq OWNED BY public.dismissed_warnings.id;


--
-- Name: operaciones; Type: TABLE; Schema: public; Owner: parvoshub_user
--

CREATE TABLE public.operaciones (
    id integer NOT NULL,
    fecha text NOT NULL,
    tipo text NOT NULL,
    cantidad real NOT NULL,
    info text,
    categoria text,
    usuario text,
    cuenta text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.operaciones OWNER TO parvoshub_user;

--
-- Name: operaciones_id_seq; Type: SEQUENCE; Schema: public; Owner: parvoshub_user
--

CREATE SEQUENCE public.operaciones_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.operaciones_id_seq OWNER TO parvoshub_user;

--
-- Name: operaciones_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: parvoshub_user
--

ALTER SEQUENCE public.operaciones_id_seq OWNED BY public.operaciones.id;


--
-- Name: presupuestos; Type: TABLE; Schema: public; Owner: parvoshub_user
--

CREATE TABLE public.presupuestos (
    id integer NOT NULL,
    mes text NOT NULL,
    categoria text NOT NULL,
    cantidad real DEFAULT 0 NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.presupuestos OWNER TO parvoshub_user;

--
-- Name: presupuestos_id_seq; Type: SEQUENCE; Schema: public; Owner: parvoshub_user
--

CREATE SEQUENCE public.presupuestos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.presupuestos_id_seq OWNER TO parvoshub_user;

--
-- Name: presupuestos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: parvoshub_user
--

ALTER SEQUENCE public.presupuestos_id_seq OWNED BY public.presupuestos.id;


--
-- Name: calendar_events id; Type: DEFAULT; Schema: public; Owner: parvoshub_user
--

ALTER TABLE ONLY public.calendar_events ALTER COLUMN id SET DEFAULT nextval('public.calendar_events_id_seq'::regclass);


--
-- Name: dismissed_warnings id; Type: DEFAULT; Schema: public; Owner: parvoshub_user
--

ALTER TABLE ONLY public.dismissed_warnings ALTER COLUMN id SET DEFAULT nextval('public.dismissed_warnings_id_seq'::regclass);


--
-- Name: operaciones id; Type: DEFAULT; Schema: public; Owner: parvoshub_user
--

ALTER TABLE ONLY public.operaciones ALTER COLUMN id SET DEFAULT nextval('public.operaciones_id_seq'::regclass);


--
-- Name: presupuestos id; Type: DEFAULT; Schema: public; Owner: parvoshub_user
--

ALTER TABLE ONLY public.presupuestos ALTER COLUMN id SET DEFAULT nextval('public.presupuestos_id_seq'::regclass);


--
-- Data for Name: calendar_events; Type: TABLE DATA; Schema: public; Owner: parvoshub_user
--

COPY public.calendar_events (id, nombre, dia_mes, cantidad_min, cantidad_max, categoria, recurrencia, activo, created_at, updated_at) FROM stdin;
1	Aniversari Tita Mamen	31	40	60	Cumpleaños	{"mes": 0, "tipo": "anual"}	t	2025-12-29 21:43:19.633613	2025-12-29 21:43:19.633613
2	Granada	10	100	200	Viaje	{"tipo": "unica", "mesAno": "2026-01"}	t	2025-12-29 23:29:31.332598	2025-12-29 23:29:31.332598
\.


--
-- Data for Name: dismissed_warnings; Type: TABLE DATA; Schema: public; Owner: parvoshub_user
--

COPY public.dismissed_warnings (id, evento_id, mes_ano, created_at) FROM stdin;
\.


--
-- Data for Name: operaciones; Type: TABLE DATA; Schema: public; Owner: parvoshub_user
--

COPY public.operaciones (id, fecha, tipo, cantidad, info, categoria, usuario, cuenta, created_at) FROM stdin;
3	2025-12-31	ingreso	2.36	Resto 2025	Ingreso	Xurxo	BBVA	2025-12-28 17:27:28.201111
4	2025-12-31	ingreso	17.34	Resto 2025	Ingreso	Xurxo	Imagin	2025-12-28 17:40:39.904258
5	2026-01-01	ingreso	350	Ingreso mes Sonia prepago	Ingreso	Sonia	BBVA	2025-12-28 17:46:48.5344
1	2025-12-31	hucha	859.91	Hucha 2025	Hucha	Xurxo	\N	2025-12-28 17:25:28.20587
6	2026-01-01	gasto	59.21	Bon Preu Esclat	Alimentación	Xurxo	BBVA	2025-12-28 19:00:34.328167
7	2026-01-01	gasto	16.65	Pai Mei	Ocio	Xurxo	BBVA	2025-12-28 19:01:05.722655
8	2026-01-01	gasto	33.59	Fregona Vileda	Extra	Xurxo	Imagin	2025-12-29 12:56:49.252671
9	2026-01-01	gasto	51.98	ECI	Alimentación	Xurxo	BBVA	2025-12-29 12:58:21.992371
10	2026-01-01	gasto	33.5	Ramen Hiroyuki	Ocio	Xurxo	BBVA	2025-12-29 13:46:05.921796
11	2026-01-01	gasto	8.25	ServiFruit	Alimentación	Xurxo	BBVA	2025-12-29 21:49:43.087546
12	2026-01-01	gasto	2.5	Churros	Ocio	Xurxo	BBVA	2025-12-30 10:41:28.514251
13	2026-01-01	gasto	48.4	Dia de la mobilitat	Ocio	Xurxo	BBVA	2025-12-30 16:45:37.496873
14	2026-01-01	ingreso	350	Ingreso mes Xurxo	ingreso	Xurxo	BBVA	2025-12-30 17:32:21.125599
19	2026-01-01	gasto	34	Cursa Sant Antoni	Deporte	Xurxo	Imagin	2025-12-30 18:14:40.67229
20	2026-01-01	gasto	65.39	Recibo Moto	Movilidad	Sonia	Imagin	2026-01-02 16:36:21.968915
21	2026-01-01	gasto	23.84	Almejas Esclat	Extra	Sonia	Imagin	2026-01-02 16:36:49.609316
22	2026-01-01	gasto	15	Gasolina Coche	Movilidad	Sonia	Imagin	2026-01-02 16:37:16.705668
23	2026-01-01	gasto	19.29	Churros	Extra	Sonia	Imagin	2026-01-02 16:37:41.064916
24	2026-01-01	gasto	32.96	Compra Esclat	Alimentación	Sonia	BBVA	2026-01-02 16:40:11.285789
25	2026-01-03	gasto	22.7	Hibrid	Ocio	Sonia	BBVA	2026-01-03 13:02:22.328251
26	2026-01-03	hucha	120	Ventas Selecta	hucha	Sonia	\N	2026-01-03 13:03:37.170817
28	2026-01-03	gasto	13.16	Ametller	Alimentación	Xurxo	BBVA	2026-01-03 19:24:43.60885
15	2026-01-01	ingreso	250	Ingreso mes Xurxo	ingreso	Xurxo	Imagin	2025-12-30 17:43:16.795689
16	2026-01-01	ingreso	275	Ingreso mes Sonia	ingreso	Sonia	Imagin	2025-12-30 17:46:18.882755
29	2026-01-01	hucha	200	Ingreso ahorro	hucha	Xurxo	\N	2026-01-04 11:44:35.994343
27	2026-01-03	gasto	5.5	Roaster Cafe	Ocio	Xurxo	BBVA	2026-01-03 19:24:21.574791
30	2026-01-04	ingreso	12	Chino	ingreso	Sonia	BBVA	2026-01-04 21:03:05.332312
31	2026-01-04	gasto	26.65	Asiático TAMI	Ocio	Sonia	BBVA	2026-01-04 21:18:29.090511
32	2026-01-05	gasto	45.75	Algrano Bistro	Ocio	Sonia	BBVA	2026-01-07 07:11:49.086126
33	2026-01-06	gasto	7.75	Condis	Alimentación	Sonia	BBVA	2026-01-07 07:12:54.742673
34	2026-01-06	gasto	8.5	Palau Música Bar	Ocio	Sonia	BBVA	2026-01-07 07:13:31.76567
35	2026-01-09	gasto	23.45	Pai mei	Ocio	Xurxo	BBVA	2026-01-10 19:11:22.66883
36	2026-01-09	gasto	52.4	Centric	Ocio	Xurxo	BBVA	2026-01-10 19:12:04.947811
37	2026-01-10	gasto	6.96	Mcdonalds aeropuerto	Ocio	Xurxo	BBVA	2026-01-10 19:12:33.24576
38	2026-01-10	gasto	11.6	Granada tapas Albaycin	Ocio	Xurxo	BBVA	2026-01-10 19:13:08.515511
39	2026-01-09	gasto	55	ropa vintage 	Extra	Xurxo	Imagin	2026-01-10 19:14:37.221922
40	2026-01-10	gasto	31.3	Taxi aeroport	Vacaciones	Xurxo	Imagin	2026-01-10 19:15:12.268673
41	2026-01-10	gasto	6.2	Bus granada	Vacaciones	Xurxo	Imagin	2026-01-10 19:15:33.445684
42	2026-01-10	gasto	40	Granada (Desayuno + Guia)	Vacaciones	Xurxo	Imagin	2026-01-10 19:16:46.605834
43	2026-01-05	gasto	27.99	Planet fitness	Deporte	Xurxo	Imagin	2026-01-10 19:18:28.731166
44	2026-01-05	gasto	22.9	Wifi	Hogar	Xurxo	Imagin	2026-01-10 19:18:50.551741
45	2026-01-05	gasto	26	Yoga	Deporte	Xurxo	Imagin	2026-01-10 19:20:54.807653
47	2026-01-10	gasto	9.7	Fogon Galicia	Ocio	Xurxo	BBVA	2026-01-12 14:32:10.227319
48	2026-01-10	gasto	15.2	Los diamantes 	Ocio	Xurxo	BBVA	2026-01-12 14:32:31.194193
49	2026-01-11	gasto	12.9	Minuit cafe Granada	Ocio	Xurxo	BBVA	2026-01-12 14:33:30.697961
50	2026-01-11	gasto	53.9	Comida Alhambra	Ocio	Xurxo	BBVA	2026-01-12 14:35:06.457874
52	2026-01-11	gasto	12.95	Libro Alhambra	Vacaciones	Xurxo	Imagin	2026-01-12 14:40:46.274665
53	2026-01-12	gasto	22.5	Cajero y tapas	Ocio	Xurxo	Imagin	2026-01-12 14:41:28.259537
54	2026-01-11	gasto	3.85	Pilas	Extra	Xurxo	Imagin	2026-01-12 14:41:51.13566
55	2026-01-12	gasto	32.41	Taxi Granada	Vacaciones	Sonia	Imagin	2026-01-13 15:52:23.347653
56	2026-01-12	gasto	19.09	Glovo McDonald's	Ocio	Sonia	BBVA	2026-01-13 15:54:01.501538
51	2026-01-11	gasto	36.2	Mercato Italiano	Ocio	Xurxo	BBVA	2026-01-12 14:35:31.459935
46	2026-01-10	gasto	22.8	Los Diamantes - Granada	Ocio	Xurxo	BBVA	2026-01-12 14:31:41.884686
57	2026-01-15	gasto	22.8	t-MES	Movilidad	Xurxo	Imagin	2026-01-15 15:58:29.886494
58	2026-01-16	gasto	2.66	Ametller	Alimentación	Sonia	BBVA	2026-01-16 13:15:15.407418
\.


--
-- Data for Name: presupuestos; Type: TABLE DATA; Schema: public; Owner: parvoshub_user
--

COPY public.presupuestos (id, mes, categoria, cantidad, created_at, updated_at) FROM stdin;
427	2026-01	Hogar	80	2026-01-04 11:39:30.296913	2026-01-04 11:39:30.296913
428	2026-01	Vehículos	232	2026-01-04 11:39:30.300507	2026-01-04 11:39:30.300507
429	2026-01	Ocio	500	2026-01-04 11:39:30.30142	2026-01-04 11:39:30.30142
431	2026-01	Extra	100	2026-01-04 11:39:30.397836	2026-01-04 11:39:30.397836
432	2026-01	Movilidad	100	2026-01-04 11:39:30.399143	2026-01-04 11:39:30.399143
435	2026-01	Deporte	53	2026-01-04 11:39:30.595314	2026-01-04 11:39:30.595314
437	2026-01	Alimentación	250	2026-01-04 11:39:30.599814	2026-01-04 11:39:30.599814
441	2026-01	Vacaciones	100	2026-01-04 11:39:30.897645	2026-01-04 11:39:30.897645
521	2026-02	Ocio	400	2026-01-15 16:04:24.53503	2026-01-15 16:04:24.53503
522	2026-02	Alimentación	300	2026-01-15 16:04:24.699015	2026-01-15 16:04:24.699015
523	2026-02	Deporte	53	2026-01-15 16:04:24.795185	2026-01-15 16:04:24.795185
524	2026-02	Hogar	100	2026-01-15 16:04:24.795193	2026-01-15 16:04:24.795193
525	2026-02	Extra	100	2026-01-15 16:04:24.797938	2026-01-15 16:04:24.797938
526	2026-02	Movilidad	100	2026-01-15 16:04:24.798923	2026-01-15 16:04:24.798923
\.


--
-- Name: calendar_events_id_seq; Type: SEQUENCE SET; Schema: public; Owner: parvoshub_user
--

SELECT pg_catalog.setval('public.calendar_events_id_seq', 2, true);


--
-- Name: dismissed_warnings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: parvoshub_user
--

SELECT pg_catalog.setval('public.dismissed_warnings_id_seq', 1, false);


--
-- Name: operaciones_id_seq; Type: SEQUENCE SET; Schema: public; Owner: parvoshub_user
--

SELECT pg_catalog.setval('public.operaciones_id_seq', 58, true);


--
-- Name: presupuestos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: parvoshub_user
--

SELECT pg_catalog.setval('public.presupuestos_id_seq', 526, true);


--
-- Name: calendar_events calendar_events_pkey; Type: CONSTRAINT; Schema: public; Owner: parvoshub_user
--

ALTER TABLE ONLY public.calendar_events
    ADD CONSTRAINT calendar_events_pkey PRIMARY KEY (id);


--
-- Name: dismissed_warnings dismissed_warnings_evento_id_mes_ano_key; Type: CONSTRAINT; Schema: public; Owner: parvoshub_user
--

ALTER TABLE ONLY public.dismissed_warnings
    ADD CONSTRAINT dismissed_warnings_evento_id_mes_ano_key UNIQUE (evento_id, mes_ano);


--
-- Name: dismissed_warnings dismissed_warnings_pkey; Type: CONSTRAINT; Schema: public; Owner: parvoshub_user
--

ALTER TABLE ONLY public.dismissed_warnings
    ADD CONSTRAINT dismissed_warnings_pkey PRIMARY KEY (id);


--
-- Name: operaciones operaciones_pkey; Type: CONSTRAINT; Schema: public; Owner: parvoshub_user
--

ALTER TABLE ONLY public.operaciones
    ADD CONSTRAINT operaciones_pkey PRIMARY KEY (id);


--
-- Name: presupuestos presupuestos_mes_categoria_key; Type: CONSTRAINT; Schema: public; Owner: parvoshub_user
--

ALTER TABLE ONLY public.presupuestos
    ADD CONSTRAINT presupuestos_mes_categoria_key UNIQUE (mes, categoria);


--
-- Name: presupuestos presupuestos_pkey; Type: CONSTRAINT; Schema: public; Owner: parvoshub_user
--

ALTER TABLE ONLY public.presupuestos
    ADD CONSTRAINT presupuestos_pkey PRIMARY KEY (id);


--
-- Name: dismissed_warnings dismissed_warnings_evento_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: parvoshub_user
--

ALTER TABLE ONLY public.dismissed_warnings
    ADD CONSTRAINT dismissed_warnings_evento_id_fkey FOREIGN KEY (evento_id) REFERENCES public.calendar_events(id) ON DELETE CASCADE;


--
-- Name: FUNCTION pg_stat_statements(showtext boolean, OUT userid oid, OUT dbid oid, OUT toplevel boolean, OUT queryid bigint, OUT query text, OUT plans bigint, OUT total_plan_time double precision, OUT min_plan_time double precision, OUT max_plan_time double precision, OUT mean_plan_time double precision, OUT stddev_plan_time double precision, OUT calls bigint, OUT total_exec_time double precision, OUT min_exec_time double precision, OUT max_exec_time double precision, OUT mean_exec_time double precision, OUT stddev_exec_time double precision, OUT rows bigint, OUT shared_blks_hit bigint, OUT shared_blks_read bigint, OUT shared_blks_dirtied bigint, OUT shared_blks_written bigint, OUT local_blks_hit bigint, OUT local_blks_read bigint, OUT local_blks_dirtied bigint, OUT local_blks_written bigint, OUT temp_blks_read bigint, OUT temp_blks_written bigint, OUT shared_blk_read_time double precision, OUT shared_blk_write_time double precision, OUT local_blk_read_time double precision, OUT local_blk_write_time double precision, OUT temp_blk_read_time double precision, OUT temp_blk_write_time double precision, OUT wal_records bigint, OUT wal_fpi bigint, OUT wal_bytes numeric, OUT wal_buffers_full bigint, OUT jit_functions bigint, OUT jit_generation_time double precision, OUT jit_inlining_count bigint, OUT jit_inlining_time double precision, OUT jit_optimization_count bigint, OUT jit_optimization_time double precision, OUT jit_emission_count bigint, OUT jit_emission_time double precision, OUT jit_deform_count bigint, OUT jit_deform_time double precision, OUT parallel_workers_to_launch bigint, OUT parallel_workers_launched bigint, OUT stats_since timestamp with time zone, OUT minmax_stats_since timestamp with time zone); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.pg_stat_statements(showtext boolean, OUT userid oid, OUT dbid oid, OUT toplevel boolean, OUT queryid bigint, OUT query text, OUT plans bigint, OUT total_plan_time double precision, OUT min_plan_time double precision, OUT max_plan_time double precision, OUT mean_plan_time double precision, OUT stddev_plan_time double precision, OUT calls bigint, OUT total_exec_time double precision, OUT min_exec_time double precision, OUT max_exec_time double precision, OUT mean_exec_time double precision, OUT stddev_exec_time double precision, OUT rows bigint, OUT shared_blks_hit bigint, OUT shared_blks_read bigint, OUT shared_blks_dirtied bigint, OUT shared_blks_written bigint, OUT local_blks_hit bigint, OUT local_blks_read bigint, OUT local_blks_dirtied bigint, OUT local_blks_written bigint, OUT temp_blks_read bigint, OUT temp_blks_written bigint, OUT shared_blk_read_time double precision, OUT shared_blk_write_time double precision, OUT local_blk_read_time double precision, OUT local_blk_write_time double precision, OUT temp_blk_read_time double precision, OUT temp_blk_write_time double precision, OUT wal_records bigint, OUT wal_fpi bigint, OUT wal_bytes numeric, OUT wal_buffers_full bigint, OUT jit_functions bigint, OUT jit_generation_time double precision, OUT jit_inlining_count bigint, OUT jit_inlining_time double precision, OUT jit_optimization_count bigint, OUT jit_optimization_time double precision, OUT jit_emission_count bigint, OUT jit_emission_time double precision, OUT jit_deform_count bigint, OUT jit_deform_time double precision, OUT parallel_workers_to_launch bigint, OUT parallel_workers_launched bigint, OUT stats_since timestamp with time zone, OUT minmax_stats_since timestamp with time zone) TO parvoshub_user;


--
-- Name: FUNCTION pg_stat_statements_info(OUT dealloc bigint, OUT stats_reset timestamp with time zone); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.pg_stat_statements_info(OUT dealloc bigint, OUT stats_reset timestamp with time zone) TO parvoshub_user;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: -; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres GRANT ALL ON SEQUENCES TO parvoshub_user;


--
-- Name: DEFAULT PRIVILEGES FOR TYPES; Type: DEFAULT ACL; Schema: -; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres GRANT ALL ON TYPES TO parvoshub_user;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: -; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres GRANT ALL ON FUNCTIONS TO parvoshub_user;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: -; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres GRANT ALL ON TABLES TO parvoshub_user;


--
-- PostgreSQL database dump complete
--

\unrestrict GIdCq3qAKeZrsPhfq77esaGNjgKpahBobV4FouJ89lyebVpJVVchKEZQfo0WaF0

