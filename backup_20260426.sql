--
-- PostgreSQL database dump
--

\restrict mjkOYTsHm0ErWlIP5aA6YhqrEwm51FU8QVnY1XZ5UZ7AYWnaxOUcujF8Zsf8fmh

-- Dumped from database version 18.3 (Debian 18.3-1.pgdg12+1)
-- Dumped by pg_dump version 18.3 (Homebrew)

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
-- Name: public; Type: SCHEMA; Schema: -; Owner: sharecampus_db_user
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO sharecampus_db_user;

--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- Name: chats_status_enum; Type: TYPE; Schema: public; Owner: sharecampus_db_user
--

CREATE TYPE public.chats_status_enum AS ENUM (
    'activo',
    'aceptado',
    'rechazado',
    'completado',
    'bloqueado'
);


ALTER TYPE public.chats_status_enum OWNER TO sharecampus_db_user;

--
-- Name: items_category_enum; Type: TYPE; Schema: public; Owner: sharecampus_db_user
--

CREATE TYPE public.items_category_enum AS ENUM (
    'Libros',
    'Calculadoras',
    'Apuntes',
    'Lab',
    'Tecnología',
    'Otros'
);


ALTER TYPE public.items_category_enum OWNER TO sharecampus_db_user;

--
-- Name: items_offer_type_enum; Type: TYPE; Schema: public; Owner: sharecampus_db_user
--

CREATE TYPE public.items_offer_type_enum AS ENUM (
    'Préstamo',
    'Intercambio',
    'Donación'
);


ALTER TYPE public.items_offer_type_enum OWNER TO sharecampus_db_user;

--
-- Name: items_status_enum; Type: TYPE; Schema: public; Owner: sharecampus_db_user
--

CREATE TYPE public.items_status_enum AS ENUM (
    'Disponible',
    'Reservado',
    'Entregado'
);


ALTER TYPE public.items_status_enum OWNER TO sharecampus_db_user;

--
-- Name: reports_category_enum; Type: TYPE; Schema: public; Owner: sharecampus_db_user
--

CREATE TYPE public.reports_category_enum AS ENUM (
    'fraudulento',
    'inapropiado',
    'spam',
    'otro'
);


ALTER TYPE public.reports_category_enum OWNER TO sharecampus_db_user;

--
-- Name: reports_status_enum; Type: TYPE; Schema: public; Owner: sharecampus_db_user
--

CREATE TYPE public.reports_status_enum AS ENUM (
    'pendiente',
    'revisado',
    'resuelto',
    'descartado'
);


ALTER TYPE public.reports_status_enum OWNER TO sharecampus_db_user;

--
-- Name: reports_target_type_enum; Type: TYPE; Schema: public; Owner: sharecampus_db_user
--

CREATE TYPE public.reports_target_type_enum AS ENUM (
    'item',
    'perfil',
    'chat'
);


ALTER TYPE public.reports_target_type_enum OWNER TO sharecampus_db_user;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: chats; Type: TABLE; Schema: public; Owner: sharecampus_db_user
--

CREATE TABLE public.chats (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    item_id uuid NOT NULL,
    sender_id uuid NOT NULL,
    receiver_id uuid NOT NULL,
    status public.chats_status_enum DEFAULT 'activo'::public.chats_status_enum NOT NULL,
    confirmation_code text,
    confirmation_expires text,
    is_confirmed boolean DEFAULT false NOT NULL,
    sender_blocked boolean DEFAULT false NOT NULL,
    receiver_blocked boolean DEFAULT false NOT NULL,
    firebase_chat_id text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.chats OWNER TO sharecampus_db_user;

--
-- Name: device_tokens; Type: TABLE; Schema: public; Owner: sharecampus_db_user
--

CREATE TABLE public.device_tokens (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    token text NOT NULL,
    platform text DEFAULT 'android'::text NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.device_tokens OWNER TO sharecampus_db_user;

--
-- Name: items; Type: TABLE; Schema: public; Owner: sharecampus_db_user
--

CREATE TABLE public.items (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    title character varying NOT NULL,
    description text,
    category public.items_category_enum NOT NULL,
    status public.items_status_enum DEFAULT 'Disponible'::public.items_status_enum NOT NULL,
    offer_type public.items_offer_type_enum NOT NULL,
    photos text,
    campus text,
    is_reported boolean DEFAULT false NOT NULL,
    report_count integer DEFAULT 0 NOT NULL,
    is_reviewed boolean DEFAULT false NOT NULL,
    user_id uuid NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.items OWNER TO sharecampus_db_user;

--
-- Name: reports; Type: TABLE; Schema: public; Owner: sharecampus_db_user
--

CREATE TABLE public.reports (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    reporter_id uuid NOT NULL,
    target_type public.reports_target_type_enum NOT NULL,
    target_id text NOT NULL,
    category public.reports_category_enum NOT NULL,
    description text,
    status public.reports_status_enum DEFAULT 'pendiente'::public.reports_status_enum NOT NULL,
    action_taken boolean DEFAULT false NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.reports OWNER TO sharecampus_db_user;

--
-- Name: users; Type: TABLE; Schema: public; Owner: sharecampus_db_user
--

CREATE TABLE public.users (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    email character varying NOT NULL,
    password_hash character varying NOT NULL,
    is_verified boolean DEFAULT false NOT NULL,
    verification_token text,
    semester integer,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    reset_password_token text,
    reset_password_expires text,
    full_name text,
    rating double precision DEFAULT '0'::double precision NOT NULL,
    rating_count integer DEFAULT 0 NOT NULL,
    exchanges_count integer DEFAULT 0 NOT NULL,
    is_profile_complete boolean DEFAULT false NOT NULL,
    photo_url text,
    faculty text
);


ALTER TABLE public.users OWNER TO sharecampus_db_user;

--
-- Name: wishlist; Type: TABLE; Schema: public; Owner: sharecampus_db_user
--

CREATE TABLE public.wishlist (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    search_query text NOT NULL,
    category text,
    campus text,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.wishlist OWNER TO sharecampus_db_user;

--
-- Data for Name: chats; Type: TABLE DATA; Schema: public; Owner: sharecampus_db_user
--

COPY public.chats (id, item_id, sender_id, receiver_id, status, confirmation_code, confirmation_expires, is_confirmed, sender_blocked, receiver_blocked, firebase_chat_id, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: device_tokens; Type: TABLE DATA; Schema: public; Owner: sharecampus_db_user
--

COPY public.device_tokens (id, user_id, token, platform, is_active, created_at) FROM stdin;
\.


--
-- Data for Name: items; Type: TABLE DATA; Schema: public; Owner: sharecampus_db_user
--

COPY public.items (id, title, description, category, status, offer_type, photos, campus, is_reported, report_count, is_reviewed, user_id, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: reports; Type: TABLE DATA; Schema: public; Owner: sharecampus_db_user
--

COPY public.reports (id, reporter_id, target_type, target_id, category, description, status, action_taken, created_at) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: sharecampus_db_user
--

COPY public.users (id, email, password_hash, is_verified, verification_token, semester, created_at, updated_at, reset_password_token, reset_password_expires, full_name, rating, rating_count, exchanges_count, is_profile_complete, photo_url, faculty) FROM stdin;
\.


--
-- Data for Name: wishlist; Type: TABLE DATA; Schema: public; Owner: sharecampus_db_user
--

COPY public.wishlist (id, user_id, search_query, category, campus, is_active, created_at) FROM stdin;
\.


--
-- Name: chats PK_0117647b3c4a4e5ff198aeb6206; Type: CONSTRAINT; Schema: public; Owner: sharecampus_db_user
--

ALTER TABLE ONLY public.chats
    ADD CONSTRAINT "PK_0117647b3c4a4e5ff198aeb6206" PRIMARY KEY (id);


--
-- Name: wishlist PK_620bff4a240d66c357b5d820eaa; Type: CONSTRAINT; Schema: public; Owner: sharecampus_db_user
--

ALTER TABLE ONLY public.wishlist
    ADD CONSTRAINT "PK_620bff4a240d66c357b5d820eaa" PRIMARY KEY (id);


--
-- Name: device_tokens PK_84700be257607cfb1f9dc2e52c3; Type: CONSTRAINT; Schema: public; Owner: sharecampus_db_user
--

ALTER TABLE ONLY public.device_tokens
    ADD CONSTRAINT "PK_84700be257607cfb1f9dc2e52c3" PRIMARY KEY (id);


--
-- Name: users PK_a3ffb1c0c8416b9fc6f907b7433; Type: CONSTRAINT; Schema: public; Owner: sharecampus_db_user
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY (id);


--
-- Name: items PK_ba5885359424c15ca6b9e79bcf6; Type: CONSTRAINT; Schema: public; Owner: sharecampus_db_user
--

ALTER TABLE ONLY public.items
    ADD CONSTRAINT "PK_ba5885359424c15ca6b9e79bcf6" PRIMARY KEY (id);


--
-- Name: reports PK_d9013193989303580053c0b5ef6; Type: CONSTRAINT; Schema: public; Owner: sharecampus_db_user
--

ALTER TABLE ONLY public.reports
    ADD CONSTRAINT "PK_d9013193989303580053c0b5ef6" PRIMARY KEY (id);


--
-- Name: users UQ_97672ac88f789774dd47f7c8be3; Type: CONSTRAINT; Schema: public; Owner: sharecampus_db_user
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE (email);


--
-- Name: device_tokens FK_17e1f528b993c6d55def4cf5bea; Type: FK CONSTRAINT; Schema: public; Owner: sharecampus_db_user
--

ALTER TABLE ONLY public.device_tokens
    ADD CONSTRAINT "FK_17e1f528b993c6d55def4cf5bea" FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: items FK_3b934e62fb52bac909e0ddf5422; Type: FK CONSTRAINT; Schema: public; Owner: sharecampus_db_user
--

ALTER TABLE ONLY public.items
    ADD CONSTRAINT "FK_3b934e62fb52bac909e0ddf5422" FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: wishlist FK_512bf776587ad5fc4f804277d76; Type: FK CONSTRAINT; Schema: public; Owner: sharecampus_db_user
--

ALTER TABLE ONLY public.wishlist
    ADD CONSTRAINT "FK_512bf776587ad5fc4f804277d76" FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: chats FK_543183a92a0aa5ae2851b69913c; Type: FK CONSTRAINT; Schema: public; Owner: sharecampus_db_user
--

ALTER TABLE ONLY public.chats
    ADD CONSTRAINT "FK_543183a92a0aa5ae2851b69913c" FOREIGN KEY (receiver_id) REFERENCES public.users(id);


--
-- Name: chats FK_81e85a5a9e8dd70b806dd32b6a5; Type: FK CONSTRAINT; Schema: public; Owner: sharecampus_db_user
--

ALTER TABLE ONLY public.chats
    ADD CONSTRAINT "FK_81e85a5a9e8dd70b806dd32b6a5" FOREIGN KEY (item_id) REFERENCES public.items(id);


--
-- Name: reports FK_9459b9bf907a3807ef7143d2ead; Type: FK CONSTRAINT; Schema: public; Owner: sharecampus_db_user
--

ALTER TABLE ONLY public.reports
    ADD CONSTRAINT "FK_9459b9bf907a3807ef7143d2ead" FOREIGN KEY (reporter_id) REFERENCES public.users(id);


--
-- Name: chats FK_ed49245ae87902459011243d69a; Type: FK CONSTRAINT; Schema: public; Owner: sharecampus_db_user
--

ALTER TABLE ONLY public.chats
    ADD CONSTRAINT "FK_ed49245ae87902459011243d69a" FOREIGN KEY (sender_id) REFERENCES public.users(id);


--
-- Name: FUNCTION uuid_generate_v1(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.uuid_generate_v1() TO sharecampus_db_user;


--
-- Name: FUNCTION uuid_generate_v1mc(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.uuid_generate_v1mc() TO sharecampus_db_user;


--
-- Name: FUNCTION uuid_generate_v3(namespace uuid, name text); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.uuid_generate_v3(namespace uuid, name text) TO sharecampus_db_user;


--
-- Name: FUNCTION uuid_generate_v4(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.uuid_generate_v4() TO sharecampus_db_user;


--
-- Name: FUNCTION uuid_generate_v5(namespace uuid, name text); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.uuid_generate_v5(namespace uuid, name text) TO sharecampus_db_user;


--
-- Name: FUNCTION uuid_nil(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.uuid_nil() TO sharecampus_db_user;


--
-- Name: FUNCTION uuid_ns_dns(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.uuid_ns_dns() TO sharecampus_db_user;


--
-- Name: FUNCTION uuid_ns_oid(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.uuid_ns_oid() TO sharecampus_db_user;


--
-- Name: FUNCTION uuid_ns_url(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.uuid_ns_url() TO sharecampus_db_user;


--
-- Name: FUNCTION uuid_ns_x500(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.uuid_ns_x500() TO sharecampus_db_user;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: -; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres GRANT ALL ON SEQUENCES TO sharecampus_db_user;


--
-- Name: DEFAULT PRIVILEGES FOR TYPES; Type: DEFAULT ACL; Schema: -; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres GRANT ALL ON TYPES TO sharecampus_db_user;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: -; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres GRANT ALL ON FUNCTIONS TO sharecampus_db_user;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: -; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres GRANT ALL ON TABLES TO sharecampus_db_user;


--
-- PostgreSQL database dump complete
--

\unrestrict mjkOYTsHm0ErWlIP5aA6YhqrEwm51FU8QVnY1XZ5UZ7AYWnaxOUcujF8Zsf8fmh

