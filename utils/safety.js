const assertSafety = (user, windowStartIso, windowEndIso) => {
  if (!user) throw new Error('SAFETY STOP: No user object provided');
  const email = (user.email || '').toLowerCase();
  const fullname = (user.fullname || user.name || '').toUpperCase();
  const hasFlag = !!user.is_test_user;
  const emailOk = email.startsWith('qa.bot+');
  const nameOk = fullname.includes('QA BOT');
  const isTest = hasFlag || (emailOk && nameOk);

  if (!isTest) throw new Error('SAFETY STOP: Attempted action on non-test user. is_test_user !== true and naming conventions not matched');
  if (!emailOk) throw new Error('SAFETY STOP: Attempted action on non-test user. email does not start with qa.bot+');
  if (!nameOk) throw new Error('SAFETY STOP: Attempted action on non-test user. fullname does not contain QA BOT');

  if (windowStartIso && windowEndIso && user.created_at) {
    const created = new Date(user.created_at).getTime();
    const start = new Date(windowStartIso).getTime();
    const end = new Date(windowEndIso).getTime();
    if (!(created >= start && created <= end)) {
      throw new Error('SAFETY STOP: Attempted action on user outside test window');
    }
  }
};

module.exports = { assertSafety };
