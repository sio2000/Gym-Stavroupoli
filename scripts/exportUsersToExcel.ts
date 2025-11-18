import { createClient } from '@supabase/supabase-js';
import xlsx from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';
import dotenv from 'dotenv';

dotenv.config({
  path: path.resolve(process.cwd(), '.env.local'),
});
dotenv.config();

const SUPABASE_URL =
  process.env.SUPABASE_SERVICE_URL ||
  process.env.SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_KEY ||
  process.env.VITE_SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL) {
  throw new Error(
    'Λείπει η μεταβλητή περιβάλλοντος SUPABASE_URL (ή VITE_SUPABASE_URL).'
  );
}

if (!SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error(
    'Λείπει η μεταβλητή περιβάλλοντος SUPABASE_SERVICE_ROLE_KEY. Χρειάζεσαι service role key για πλήρη πρόσβαση.'
  );
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    persistSession: false,
  },
});

type RawMembership = {
  id: string;
  user_id: string;
  status: string;
  is_active: boolean;
  start_date: string;
  end_date: string | null;
  source_package_name?: string | null;
  package?: {
    id?: string;
    name?: string | null;
    package_type?: string | null;
  } | null;
};

type RawPilatesDeposit = {
  id: string;
  user_id: string;
  deposit_remaining: number | null;
  is_active: boolean;
  credited_at: string | null;
  expires_at: string | null;
};

type RawLessonDeposit = {
  id: string;
  user_id: string;
  total_lessons: number | null;
  used_lessons: number | null;
  remaining_lessons: number | null;
  expires_at: string | null;
};

type RawUser = {
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  language?: string | null;
  role?: string | null;
  created_at: string;
  updated_at: string;
  memberships?: RawMembership[] | null;
  pilates_deposits?: RawPilatesDeposit[] | null;
  lesson_deposits?: RawLessonDeposit[] | null;
};

const PAGE_SIZE = 500;
const todayIso = new Date().toISOString().split('T')[0];

const isMembershipCurrentlyActive = (membership: RawMembership): boolean => {
  if (!membership) return false;
  if (!membership.is_active) return false;
  if (membership.status && membership.status !== 'active') return false;
  if (membership.end_date && membership.end_date < todayIso) return false;
  return true;
};

const describeMembership = (membership: RawMembership): string => {
  const pkgName =
    membership.package?.name ||
    membership.source_package_name ||
    membership.package?.package_type ||
    'Άγνωστο πακέτο';
  const statusLabel = isMembershipCurrentlyActive(membership)
    ? 'Ενεργή'
    : membership.status || 'Μη ενεργή';
  return `${pkgName} (${membership.start_date} → ${
    membership.end_date || '—'
  }) [${statusLabel}]`;
};

const formatPilatesDeposit = (
  deposit: RawPilatesDeposit | undefined
): { remaining: number; status: string; expires_at: string } => {
  if (!deposit) {
    return { remaining: 0, status: 'Μη ενεργό', expires_at: '' };
  }
  return {
    remaining: deposit.deposit_remaining ?? 0,
    status: deposit.is_active ? 'Ενεργό' : 'Μη ενεργό',
    expires_at: deposit.expires_at || '',
  };
};

const formatLessonDeposit = (
  deposit: RawLessonDeposit | undefined
): {
  total: number;
  used: number;
  remaining: number;
  status: string;
  expires_at: string;
} => {
  if (!deposit) {
    return {
      total: 0,
      used: 0,
      remaining: 0,
      status: 'Μη ενεργό',
      expires_at: '',
    };
  }
  return {
    total: deposit.total_lessons ?? 0,
    used: deposit.used_lessons ?? 0,
    remaining: deposit.remaining_lessons ?? 0,
    status:
      deposit.remaining_lessons !== null && deposit.remaining_lessons > 0
        ? 'Ενεργό'
        : 'Μη ενεργό',
    expires_at: deposit.expires_at || '',
  };
};

const fetchAllUsers = async (): Promise<RawUser[]> => {
  const allUsers: RawUser[] = [];
  let page = 0;

  const chunkArray = <T>(input: T[], chunkSize: number): T[][] => {
    const chunks: T[][] = [];
    for (let i = 0; i < input.length; i += chunkSize) {
      chunks.push(input.slice(i, i + chunkSize));
    }
    return chunks;
  };

  const fetchMembershipChunks = async (userIds: string[]): Promise<RawMembership[]> => {
    const results: RawMembership[] = [];
    const chunks = chunkArray(userIds, 50);
    for (const chunk of chunks) {
      if (chunk.length === 0) continue;
      const { data, error } = await supabase
        .from('memberships')
        .select(
          `
          id,
          user_id,
          status,
          is_active,
          start_date,
          end_date,
          source_package_name,
          package:membership_packages(
            id,
            name,
            package_type
          )
        `
        )
        .in('user_id', chunk);
      if (error) throw error;
      if (data) {
        results.push(...(data as RawMembership[]));
      }
    }
    return results;
  };

  const fetchPilatesChunks = async (userIds: string[]): Promise<RawPilatesDeposit[]> => {
    const results: RawPilatesDeposit[] = [];
    const chunks = chunkArray(userIds, 100);
    for (const chunk of chunks) {
      if (chunk.length === 0) continue;
      const { data, error } = await supabase
        .from('pilates_deposits')
        .select('id, user_id, deposit_remaining, is_active, credited_at, expires_at')
        .in('user_id', chunk);
      if (error) throw error;
      if (data) {
        results.push(...(data as RawPilatesDeposit[]));
      }
    }
    return results;
  };

  const fetchLessonChunks = async (userIds: string[]): Promise<RawLessonDeposit[]> => {
    const results: RawLessonDeposit[] = [];
    const chunks = chunkArray(userIds, 100);
    for (const chunk of chunks) {
      if (chunk.length === 0) continue;
      const { data, error } = await supabase
        .from('lesson_deposits')
      .select('id, user_id, total_lessons, used_lessons, remaining_lessons, expires_at')
        .in('user_id', chunk);
      if (error) throw error;
      if (data) {
        results.push(...(data as RawLessonDeposit[]));
      }
    }
    return results;
  };

  while (true) {
    const from = page * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;
    const { data: users, error: usersError } = await supabase
      .from('user_profiles')
      .select(
        `
        user_id,
        first_name,
        last_name,
        email,
        phone,
        language,
        role,
        created_at,
        updated_at
      `
      )
      .order('created_at', { ascending: true })
      .range(from, to);

    if (usersError) {
      throw usersError;
    }

    if (!users || users.length === 0) {
      break;
    }

    const userIds = users.map((user) => user.user_id);

    const [membershipsData, pilatesData, lessonData] = await Promise.all([
      fetchMembershipChunks(userIds),
      fetchPilatesChunks(userIds),
      fetchLessonChunks(userIds),
    ]);

    const membershipsByUser = new Map<string, RawMembership[]>();
    membershipsData.forEach((membership) => {
      const arr = membershipsByUser.get(membership.user_id) || [];
      arr.push(membership as RawMembership);
      membershipsByUser.set(membership.user_id, arr);
    });

    const pilatesByUser = new Map<string, RawPilatesDeposit[]>();
    pilatesData.forEach((deposit) => {
      const arr = pilatesByUser.get(deposit.user_id) || [];
      arr.push(deposit as RawPilatesDeposit);
      pilatesByUser.set(deposit.user_id, arr);
    });

    const lessonsByUser = new Map<string, RawLessonDeposit[]>();
    lessonData.forEach((deposit) => {
      const arr = lessonsByUser.get(deposit.user_id) || [];
      arr.push(deposit as RawLessonDeposit);
      lessonsByUser.set(deposit.user_id, arr);
    });

    const enrichedUsers: RawUser[] = users.map((user) => ({
      ...user,
      memberships: membershipsByUser.get(user.user_id) || [],
      pilates_deposits: pilatesByUser.get(user.user_id) || [],
      lesson_deposits: lessonsByUser.get(user.user_id) || [],
    }));

    allUsers.push(...enrichedUsers);

    if (users.length < PAGE_SIZE) {
      break;
    }

    page += 1;
  }

  return allUsers;
};

const exportToExcel = (rows: Record<string, unknown>[]) => {
  const workbook = xlsx.utils.book_new();
  const worksheet = xlsx.utils.json_to_sheet(rows);
  xlsx.utils.book_append_sheet(workbook, worksheet, 'Users');

  const outputDir = path.resolve(process.cwd(), 'exports');
  fs.mkdirSync(outputDir, { recursive: true });
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filePath = path.join(
    outputDir,
    `users-memberships-${timestamp}.xlsx`
  );

  xlsx.writeFile(workbook, filePath, { bookType: 'xlsx' });

  return filePath;
};

const main = async () => {
  console.log('Ξεκινά η εξαγωγή δεδομένων χρηστών...');
  const users = await fetchAllUsers();
  console.log(`Βρέθηκαν ${users.length} χρήστες. Δημιουργώ γραμμές...`);

  const rows = users.map((user) => {
    const memberships = Array.isArray(user.memberships)
      ? (user.memberships as RawMembership[])
      : [];
    const activeMemberships = memberships.filter(isMembershipCurrentlyActive);

    const pilatesDeposit = formatPilatesDeposit(
      (user.pilates_deposits || []).find((d) => d.is_active)
    );
    const lessonDeposit = formatLessonDeposit(
      (user.lesson_deposits || []).find((d) => d.is_active)
    );

    return {
      user_id: user.user_id,
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      email: user.email || '',
      phone: user.phone || '',
      language: user.language || '',
      role: user.role || '',
      created_at: user.created_at,
      updated_at: user.updated_at,
      active_memberships_count: activeMemberships.length,
      active_memberships: activeMemberships.map(describeMembership).join('\n'),
      all_memberships: memberships.map(describeMembership).join('\n'),
      pilates_lessons_status: pilatesDeposit.status,
      pilates_lessons_remaining: pilatesDeposit.remaining,
      pilates_lessons_expires_at: pilatesDeposit.expires_at,
      lesson_deposit_status: lessonDeposit.status,
      lesson_deposit_total: lessonDeposit.total,
      lesson_deposit_used: lessonDeposit.used,
      lesson_deposit_remaining: lessonDeposit.remaining,
      lesson_deposit_expires_at: lessonDeposit.expires_at,
    };
  });

  const filePath = exportToExcel(rows);
  console.log(`Η εξαγωγή ολοκληρώθηκε: ${filePath}`);
};

main().catch((error) => {
  console.error('Το export απέτυχε.', error);
  process.exitCode = 1;
});

