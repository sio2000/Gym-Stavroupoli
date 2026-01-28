const assertSafety = (user, windowStartIso, windowEndIso) => {
  if (!user) throw new Error('SAFETY STOP: No user object provided');
  const email = (user.email || '').toLowerCase();
  const fullname = (user.fullname || user.name || '').toUpperCase();
  const isTest = !!user.is_test_user;

  if (!isTest) throw new Error('SAFETY STOP: Attempted action on non-test user. is_test_user !== true');
  if (!email.startsWith('qa.bot+')) throw new Error('SAFETY STOP: Attempted action on non-test user. email does not start with qa.bot+');
  if (!fullname.includes('QA BOT')) throw new Error('SAFETY STOP: Attempted action on non-test user. fullname does not contain QA BOT');

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
