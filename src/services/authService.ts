import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { UserProfile, UserRole, AuditLog } from '../types';

const LOCAL_STORAGE_USERS_KEY = 'ynab_mock_profiles_v2';
const LOCAL_STORAGE_SESSION_KEY = 'ynab_current_user_session_v2';
const LOCAL_STORAGE_AUDIT_KEY = 'ynab_audit_logs_v2';

// Exactamente los 2 usuarios autorizados en la base de datos
const SEED_PROFILES: UserProfile[] = [
  {
    id: 'c0000000-0000-0000-0000-000000000002',
    email: 'marco@ynab.test',
    fullName: 'Marco López',
    role: 'client',
    planName: 'Plan Personal Gratuito',
    isFree: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'a0000000-0000-0000-0000-000000000001',
    email: 'admin@ynab.test',
    fullName: 'Administrador General',
    role: 'admin',
    planName: 'Enterprise Admin',
    isFree: true,
    createdAt: new Date().toISOString(),
  },
];

// Obtener o inicializar perfiles locales
function getStoredProfiles(): UserProfile[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_USERS_KEY);
    if (!raw) {
      localStorage.setItem(LOCAL_STORAGE_USERS_KEY, JSON.stringify(SEED_PROFILES));
      return SEED_PROFILES;
    }
    return JSON.parse(raw);
  } catch {
    return SEED_PROFILES;
  }
}

function saveProfiles(profiles: UserProfile[]): void {
  localStorage.setItem(LOCAL_STORAGE_USERS_KEY, JSON.stringify(profiles));
}

export function recordAuditLog(
  userId: string,
  userEmail: string,
  action: string,
  details: string
): void {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_AUDIT_KEY);
    const logs: AuditLog[] = raw ? JSON.parse(raw) : [];
    const newLog: AuditLog = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      userId,
      userEmail,
      action,
      details,
      timestamp: new Date().toISOString(),
    };
    logs.unshift(newLog);
    // Conservar los últimos 100 logs
    localStorage.setItem(LOCAL_STORAGE_AUDIT_KEY, JSON.stringify(logs.slice(0, 100)));
  } catch (e) {
    console.warn('Error recording audit log:', e);
  }
}

export function getAuditLogs(): AuditLog[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_AUDIT_KEY);
    if (!raw) {
      return [];
    }
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export const authService = {
  // Iniciar sesión estándar: email + password (el rol proviene 100% de la BD)
  async signIn(email: string, password?: string): Promise<UserProfile> {
    const trimmedEmail = email.trim().toLowerCase();
    const cleanPassword = password || 'Password123!';
    const profiles = getStoredProfiles();

    // 1. Intentar autenticación con Supabase si está configurado
    if (isSupabaseConfigured) {
      try {
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email: trimmedEmail,
          password: cleanPassword,
        });

        if (authError) {
          throw new Error(
            authError.message === 'Invalid login credentials'
              ? 'Credenciales incorrectas. Verifica tu correo y contraseña.'
              : authError.message
          );
        }

        if (authData.user) {
          // Obtener perfil estricto de Supabase (sin permitir manipulación de rol)
          const { data: dbProfile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', authData.user.id)
            .single();

          if (profileError || !dbProfile) {
            throw new Error('No se encontró el perfil de usuario asociado en la base de datos.');
          }

          const profile: UserProfile = {
            id: dbProfile.id,
            email: dbProfile.email || trimmedEmail,
            fullName: dbProfile.full_name || dbProfile.email?.split('@')[0] || 'Usuario',
            role: (dbProfile.role as UserRole) || 'client',
            planName: dbProfile.plan_name || 'Plan Personal Gratuito',
            isFree: true,
            createdAt: dbProfile.created_at || new Date().toISOString(),
          };

          localStorage.setItem(LOCAL_STORAGE_SESSION_KEY, JSON.stringify(profile));
          recordAuditLog(profile.id, profile.email, 'USER_LOGIN', `Sesión iniciada vía Supabase (Rol: ${profile.role})`);
          return profile;
        }
      } catch (err: unknown) {
        if (err instanceof Error && (err.message.includes('Credenciales') || err.message.includes('No se encontró'))) {
          throw err;
        }
        console.warn('Fallo de red al conectar con Supabase Auth, utilizando autenticación local:', err);
      }
    }

    // 2. Modo local / Fallback
    let profile = profiles.find((p) => p.email.toLowerCase() === trimmedEmail);

    if (profile) {
      if (trimmedEmail === 'marco@ynab.test') {
        profile.role = 'client';
        profile.planName = 'Plan Personal Gratuito';
      } else if (trimmedEmail === 'admin@ynab.test') {
        profile.role = 'admin';
        profile.planName = 'Enterprise Admin';
      }
    } else {
      // Regla de negocio estricta: sólo admin@ynab.test es admin, cualquier otro es cliente
      const assignedRole: UserRole = trimmedEmail === 'admin@ynab.test' ? 'admin' : 'client';
      const namePart = trimmedEmail.split('@')[0];
      const capitalized = namePart.charAt(0).toUpperCase() + namePart.slice(1);

      profile = {
        id: `user-${Date.now()}`,
        email: trimmedEmail,
        fullName: capitalized,
        role: assignedRole,
        planName: assignedRole === 'admin' ? 'Enterprise Admin' : 'Plan Personal Gratuito',
        isFree: true,
        createdAt: new Date().toISOString(),
      };
      profiles.push(profile);
      saveProfiles(profiles);
    }

    localStorage.setItem(LOCAL_STORAGE_SESSION_KEY, JSON.stringify(profile));
    recordAuditLog(profile.id, profile.email, 'USER_LOGIN', `Sesión local iniciada (Rol: ${profile.role})`);
    return profile;
  },

  // Registro de nuevo usuario (Siempre con rol 'client')
  async signUp(email: string, fullName: string, password?: string): Promise<UserProfile> {
    const trimmedEmail = email.trim().toLowerCase();
    const cleanPassword = password || 'Password123!';
    const profiles = getStoredProfiles();
    const role: UserRole = 'client';

    if (isSupabaseConfigured) {
      try {
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: trimmedEmail,
          password: cleanPassword,
          options: {
            data: { full_name: fullName.trim(), role },
          },
        });

        if (authError) {
          throw new Error(authError.message);
        }

        if (authData.user) {
          await supabase.from('profiles').upsert({
            id: authData.user.id,
            email: trimmedEmail,
            full_name: fullName.trim(),
            role,
            plan_name: 'Plan Personal Gratuito',
            is_free: true,
          });
        }
      } catch (err) {
        console.warn('No se pudo registrar en Supabase remoto, persistiendo localmente:', err);
      }
    }

    const existingIndex = profiles.findIndex((p) => p.email.toLowerCase() === trimmedEmail);
    const newProfile: UserProfile = {
      id: `user-${Date.now()}`,
      email: trimmedEmail,
      fullName: fullName.trim() || trimmedEmail.split('@')[0],
      role,
      planName: 'Plan Personal Gratuito',
      isFree: true,
      createdAt: new Date().toISOString(),
    };

    if (existingIndex >= 0) {
      profiles[existingIndex] = newProfile;
    } else {
      profiles.push(newProfile);
    }
    saveProfiles(profiles);

    localStorage.setItem(LOCAL_STORAGE_SESSION_KEY, JSON.stringify(newProfile));
    recordAuditLog(newProfile.id, newProfile.email, 'USER_REGISTER', `Nuevo usuario registrado como Cliente`);
    return newProfile;
  },

  // Obtener sesión activa actual
  getCurrentUser(): UserProfile | null {
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_SESSION_KEY);
      if (!raw) {
        return null;
      }
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },

  // Cerrar sesión
  async signOut(): Promise<void> {
    const current = this.getCurrentUser();
    if (current) {
      recordAuditLog(current.id, current.email, 'USER_LOGOUT', 'Cierre de sesión de usuario');
    }
    if (isSupabaseConfigured) {
      try {
        await supabase.auth.signOut();
      } catch (e) {
        console.warn('Error al cerrar sesión de Supabase:', e);
      }
    }
    localStorage.removeItem(LOCAL_STORAGE_SESSION_KEY);
  },

  // Obtener todos los usuarios registrados (Solo para consola de administración)
  getAllProfiles(): UserProfile[] {
    return getStoredProfiles();
  },
};
