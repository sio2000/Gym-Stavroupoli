export function isInstallmentsEligible(packageName: string, durationType: string): boolean {
  const pkg = packageName;
  if (pkg === 'Ultimate') return true;
  if (pkg === 'Free Gym') return ['semester', 'year'].includes(durationType);
  if (pkg === 'Pilates') return ['pilates_6months', 'pilates_1year'].includes(durationType);
  return false;
}



