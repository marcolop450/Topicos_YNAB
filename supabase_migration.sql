-- ============================================================================
-- SCRIPT COMPLETO Y DEFINITIVO PARA SUPABASE (POSTGRESQL)
-- Proyecto: YNAB Presupuesto en Base Cero (100% Gratuito y Multi-Rol)
-- Incluye:
--  1. Estructura de Tablas en Orden de Dependencia Correcto
--  2. Políticas de Seguridad RLS (Row Level Security)
--  3. Trigger Automático para Perfiles en Registro
--  4. Creación de Exclusivamente 2 Usuarios de Autenticación: Admin (admin@ynab.test) y Cliente (marco@ynab.test)
--  5. CERO Datos Semilla (Tablas financieras y de soporte 100% limpias)
-- ============================================================================

-- Habilitar extensión pgcrypto en el esquema extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- ============================================================================
-- 1. CREACIÓN DE TABLAS DEL MODELO DE DATOS
-- ============================================================================

-- 1.1 Perfiles de Usuario (Roles y Plan Gratuito)
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid NOT NULL,
  email text NOT NULL,
  full_name text NOT NULL,
  role text NOT NULL DEFAULT 'client' CHECK (role IN ('client', 'admin')),
  plan_name text NOT NULL DEFAULT 'Plan Personal Gratuito',
  is_free boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- 1.2 Cuentas Financieras (Líquidas y de Tarjetas)
CREATE TABLE IF NOT EXISTS public.accounts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('CHECKING', 'SAVINGS', 'CREDIT_CARD', 'CASH')),
  initial_balance_cents bigint NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT accounts_pkey PRIMARY KEY (id),
  CONSTRAINT accounts_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- 1.3 Grupos de Categorías
CREATE TABLE IF NOT EXISTS public.category_groups (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  name text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT category_groups_pkey PRIMARY KEY (id),
  CONSTRAINT category_groups_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- 1.4 Categorías (Sobres de Gasto)
CREATE TABLE IF NOT EXISTS public.categories (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  group_id uuid NOT NULL,
  name text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  is_hidden boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT categories_pkey PRIMARY KEY (id),
  CONSTRAINT categories_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT categories_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.category_groups(id) ON DELETE CASCADE
);

-- 1.5 Metas de Ahorro por Categoría (Targets / Inspector Lateral)
CREATE TABLE IF NOT EXISTS public.category_targets (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  category_id uuid NOT NULL,
  target_amount_cents bigint NOT NULL DEFAULT 0,
  target_type text NOT NULL CHECK (target_type IN ('MONTHLY_NEEDED', 'TARGET_BALANCE')),
  due_day_of_month integer DEFAULT 31,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT category_targets_pkey PRIMARY KEY (id),
  CONSTRAINT category_targets_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT category_targets_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE CASCADE,
  CONSTRAINT category_targets_user_category_unique UNIQUE (user_id, category_id)
);

-- 1.6 Beneficiarios / Payees
CREATE TABLE IF NOT EXISTS public.payees (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  name text NOT NULL,
  is_system boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT payees_pkey PRIMARY KEY (id),
  CONSTRAINT payees_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- 1.7 Transacciones Contables (Estándar, Dividida, Transferencia)
CREATE TABLE IF NOT EXISTS public.transactions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  account_id uuid NOT NULL,
  date date NOT NULL,
  amount_cents bigint NOT NULL,
  payee_id uuid,
  category_id uuid,
  type text NOT NULL CHECK (type IN ('STANDARD', 'SPLIT', 'TRANSFER')),
  memo text DEFAULT '',
  transfer_account_id uuid,
  transfer_transaction_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT transactions_pkey PRIMARY KEY (id),
  CONSTRAINT transactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT transactions_account_id_fkey FOREIGN KEY (account_id) REFERENCES public.accounts(id) ON DELETE CASCADE,
  CONSTRAINT transactions_payee_id_fkey FOREIGN KEY (payee_id) REFERENCES public.payees(id) ON DELETE SET NULL,
  CONSTRAINT transactions_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE SET NULL,
  CONSTRAINT transactions_transfer_account_id_fkey FOREIGN KEY (transfer_account_id) REFERENCES public.accounts(id) ON DELETE SET NULL,
  CONSTRAINT transactions_transfer_transaction_id_fkey FOREIGN KEY (transfer_transaction_id) REFERENCES public.transactions(id) ON DELETE SET NULL
);

-- 1.8 Desglose de Transacciones Divididas (Splits)
CREATE TABLE IF NOT EXISTS public.transaction_splits (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  transaction_id uuid NOT NULL,
  category_id uuid NOT NULL,
  amount_cents bigint NOT NULL,
  memo text DEFAULT '',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT transaction_splits_pkey PRIMARY KEY (id),
  CONSTRAINT transaction_splits_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT transaction_splits_transaction_id_fkey FOREIGN KEY (transaction_id) REFERENCES public.transactions(id) ON DELETE CASCADE,
  CONSTRAINT transaction_splits_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE CASCADE
);

-- 1.9 Asignaciones Mensuales de Presupuesto
CREATE TABLE IF NOT EXISTS public.budget_assignments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  month text NOT NULL,
  category_id uuid NOT NULL,
  assigned_cents bigint NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT budget_assignments_pkey PRIMARY KEY (id),
  CONSTRAINT budget_assignments_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT budget_assignments_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE CASCADE,
  CONSTRAINT budget_assignments_user_month_cat_unique UNIQUE (user_id, month, category_id)
);

-- 1.10 Mensajes de Soporte al Cliente
CREATE TABLE IF NOT EXISTS public.support_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  user_email text NOT NULL,
  user_name text NOT NULL,
  sender text NOT NULL CHECK (sender IN ('client', 'admin')),
  content text NOT NULL,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'answered')),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT support_messages_pkey PRIMARY KEY (id),
  CONSTRAINT support_messages_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- 1.11 Bitácora Inmutable de Auditoría
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  user_email text NOT NULL,
  action text NOT NULL,
  details text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT audit_logs_pkey PRIMARY KEY (id),
  CONSTRAINT audit_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL
);

-- ============================================================================
-- 2. ÍNDICES DE RENDIMIENTO PARA CONSULTAS RÁPIDAS
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_accounts_user ON public.accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_categories_user_group ON public.categories(user_id, group_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON public.transactions(user_id, date);
CREATE INDEX IF NOT EXISTS idx_transactions_account ON public.transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_assignments_user_month ON public.budget_assignments(user_id, month);
CREATE INDEX IF NOT EXISTS idx_targets_user ON public.category_targets(user_id);
CREATE INDEX IF NOT EXISTS idx_support_user ON public.support_messages(user_id);

-- ============================================================================
-- 3. TRIGGER AUTOMÁTICO PARA CREAR PERFIL AL REGISTRARSE
-- ============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, plan_name, is_free)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    COALESCE(new.raw_user_meta_data->>'role', 'client'),
    'Plan Personal Gratuito',
    true
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- 4. HABILITACIÓN DE ROW LEVEL SECURITY (RLS)
-- ============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.category_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.category_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaction_splits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budget_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 5. POLÍTICAS DE ACCESO RLS
-- ============================================================================

-- Función auxiliar segura para evitar recursión infinita en RLS de perfiles
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Perfiles
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
CREATE POLICY "profiles_select_policy" ON public.profiles FOR SELECT USING (
  auth.uid() = id OR public.is_admin()
);

DROP POLICY IF EXISTS "profiles_update_policy" ON public.profiles;
CREATE POLICY "profiles_update_policy" ON public.profiles FOR UPDATE USING (
  auth.uid() = id OR public.is_admin()
);

DROP POLICY IF EXISTS "profiles_insert_policy" ON public.profiles;
CREATE POLICY "profiles_insert_policy" ON public.profiles FOR INSERT WITH CHECK (
  auth.uid() = id OR auth.uid() IS NULL
);

-- Cuentas
DROP POLICY IF EXISTS "accounts_policy" ON public.accounts;
CREATE POLICY "accounts_policy" ON public.accounts FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Grupos
DROP POLICY IF EXISTS "category_groups_policy" ON public.category_groups;
CREATE POLICY "category_groups_policy" ON public.category_groups FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Categorías
DROP POLICY IF EXISTS "categories_policy" ON public.categories;
CREATE POLICY "categories_policy" ON public.categories FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Metas (Targets)
DROP POLICY IF EXISTS "category_targets_policy" ON public.category_targets;
CREATE POLICY "category_targets_policy" ON public.category_targets FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Payees
DROP POLICY IF EXISTS "payees_policy" ON public.payees;
CREATE POLICY "payees_policy" ON public.payees FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Transacciones
DROP POLICY IF EXISTS "transactions_policy" ON public.transactions;
CREATE POLICY "transactions_policy" ON public.transactions FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Splits
DROP POLICY IF EXISTS "transaction_splits_policy" ON public.transaction_splits;
CREATE POLICY "transaction_splits_policy" ON public.transaction_splits FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Asignaciones Presupuestarias
DROP POLICY IF EXISTS "budget_assignments_policy" ON public.budget_assignments;
CREATE POLICY "budget_assignments_policy" ON public.budget_assignments FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Soporte: Cliente ve y escribe sus mensajes; Admin ve y responde todos
DROP POLICY IF EXISTS "support_messages_select" ON public.support_messages;
CREATE POLICY "support_messages_select" ON public.support_messages FOR SELECT USING (
  auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

DROP POLICY IF EXISTS "support_messages_insert" ON public.support_messages;
CREATE POLICY "support_messages_insert" ON public.support_messages FOR INSERT WITH CHECK (
  auth.uid() = user_id
);

DROP POLICY IF EXISTS "support_messages_admin_all" ON public.support_messages;
CREATE POLICY "support_messages_admin_all" ON public.support_messages FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Auditoría: Usuarios pueden insertar registros; Admins pueden consultarlos
DROP POLICY IF EXISTS "audit_logs_insert" ON public.audit_logs;
CREATE POLICY "audit_logs_insert" ON public.audit_logs FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "audit_logs_select" ON public.audit_logs;
CREATE POLICY "audit_logs_select" ON public.audit_logs FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- ============================================================================
-- 6. CREACIÓN DE LOS 2 USUARIOS DE PRUEBA EN AUTH.USERS Y PROFILES
-- ============================================================================
-- Credenciales:
-- 1. Administrador: admin@ynab.test / Password123!
-- 2. Cliente:       marco@ynab.test / Password123!

DO $$
DECLARE
  v_admin_id uuid := 'a0000000-0000-0000-0000-000000000001'::uuid;
  v_client_id uuid := 'c0000000-0000-0000-0000-000000000002'::uuid;
  v_encrypted_pwd text := extensions.crypt('Password123!', extensions.gen_salt('bf'));
  v_grp_needs uuid := gen_random_uuid();
  v_grp_life uuid := gen_random_uuid();
  v_grp_save uuid := gen_random_uuid();
  v_cat_rent uuid := gen_random_uuid();
  v_cat_groc uuid := gen_random_uuid();
  v_cat_util uuid := gen_random_uuid();
  v_cat_emer uuid := gen_random_uuid();
  v_acc_checking uuid := gen_random_uuid();
  v_acc_savings uuid := gen_random_uuid();
  v_payee_employer uuid := gen_random_uuid();
  v_payee_market uuid := gen_random_uuid();
BEGIN
  -- Insertar Admin en auth.users si no existe
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'admin@ynab.test') THEN
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, aud, role, created_at, updated_at
    ) VALUES (
      v_admin_id, '00000000-0000-0000-0000-000000000000'::uuid,
      'admin@ynab.test', v_encrypted_pwd, now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"Administrador General","role":"admin"}'::jsonb,
      'authenticated', 'authenticated', now(), now()
    );

    -- Inserción segura y dinámica en auth.identities compatible con todas las versiones de Supabase
    BEGIN
      IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'auth' AND table_name = 'identities' AND column_name = 'provider_id'
      ) THEN
        EXECUTE 'INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, now(), now(), now()) ON CONFLICT DO NOTHING'
        USING v_admin_id, v_admin_id, json_build_object('sub', v_admin_id::text, 'email', 'admin@ynab.test')::jsonb, 'email', v_admin_id::text;
      ELSE
        EXECUTE 'INSERT INTO auth.identities (id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at) VALUES ($1, $2, $3, $4, now(), now(), now()) ON CONFLICT DO NOTHING'
        USING v_admin_id, v_admin_id, json_build_object('sub', v_admin_id::text, 'email', 'admin@ynab.test')::jsonb, 'email';
      END IF;
    EXCEPTION WHEN OTHERS THEN
      NULL;
    END;
  ELSE
    SELECT id INTO v_admin_id FROM auth.users WHERE email = 'admin@ynab.test';
  END IF;

  -- Insertar Cliente en auth.users si no existe
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'marco@ynab.test') THEN
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, aud, role, created_at, updated_at
    ) VALUES (
      v_client_id, '00000000-0000-0000-0000-000000000000'::uuid,
      'marco@ynab.test', v_encrypted_pwd, now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"Marco López","role":"client"}'::jsonb,
      'authenticated', 'authenticated', now(), now()
    );

    BEGIN
      IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'auth' AND table_name = 'identities' AND column_name = 'provider_id'
      ) THEN
        EXECUTE 'INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, now(), now(), now()) ON CONFLICT DO NOTHING'
        USING v_client_id, v_client_id, json_build_object('sub', v_client_id::text, 'email', 'marco@ynab.test')::jsonb, 'email', v_client_id::text;
      ELSE
        EXECUTE 'INSERT INTO auth.identities (id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at) VALUES ($1, $2, $3, $4, now(), now(), now()) ON CONFLICT DO NOTHING'
        USING v_client_id, v_client_id, json_build_object('sub', v_client_id::text, 'email', 'marco@ynab.test')::jsonb, 'email';
      END IF;
    EXCEPTION WHEN OTHERS THEN
      NULL;
    END;
  ELSE
    SELECT id INTO v_client_id FROM auth.users WHERE email = 'marco@ynab.test';
  END IF;

  -- 3. Asegurar perfiles en public.profiles
  INSERT INTO public.profiles (id, email, full_name, role, plan_name, is_free)
  VALUES
    (v_admin_id, 'admin@ynab.test', 'Administrador General', 'admin', 'Enterprise Admin', true),
    (v_client_id, 'marco@ynab.test', 'Marco López', 'client', 'Plan Personal Gratuito', true)
  ON CONFLICT (id) DO UPDATE SET
    role = EXCLUDED.role,
    full_name = EXCLUDED.full_name,
    plan_name = EXCLUDED.plan_name,
    is_free = true;

END $$;

