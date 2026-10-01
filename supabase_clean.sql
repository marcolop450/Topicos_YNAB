-- ============================================================================
-- SCRIPT DE LIMPIEZA COMPLETA PARA SUPABASE (POSTGRESQL)
-- Proyecto: YNAB Presupuesto en Base Cero
-- Propósito: Vaciar todas las tablas de negocio y eliminar registros previos,
--            dejando la base de datos completamente limpia y lista para migrar.
-- ============================================================================

-- 1. Desactivar temporalmente disparadores de integridad para limpieza rápida
SET session_replication_role = 'replica';

-- 2. Vaciar todas las tablas de la aplicación en cascada (CERO datos residuales)
TRUNCATE TABLE 
  public.transaction_splits,
  public.transactions,
  public.budget_assignments,
  public.category_targets,
  public.categories,
  public.category_groups,
  public.accounts,
  public.payees,
  public.support_messages,
  public.audit_logs,
  public.profiles
CASCADE;

-- 3. Reactivar restricciones de integridad
SET session_replication_role = 'origin';

-- 4. Eliminar identidades y usuarios de autenticación previos en Supabase Auth
--    (Para permitir que supabase_migration.sql los vuelva a crear de forma limpia)
DELETE FROM auth.identities 
WHERE user_id IN (
  SELECT id FROM auth.users WHERE email IN ('admin@ynab.test', 'marco@ynab.test')
);

DELETE FROM auth.users 
WHERE email IN ('admin@ynab.test', 'marco@ynab.test');

-- 5. Mensaje de confirmación en la consola de Supabase
DO $$
BEGIN
  RAISE NOTICE 'Base de datos limpiada exitosamente. Todas las tablas están en 0 registros y los usuarios de prueba han sido removidos.';
END $$;
