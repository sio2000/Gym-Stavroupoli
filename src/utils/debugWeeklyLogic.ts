// DEBUG WEEKLY LOGIC
// This file helps debug the weekly logic calculations

export const debugWeeklyLogic = () => {
  const today = new Date();
  console.log('=== DEBUG WEEKLY LOGIC ===');
  console.log('Today:', today.toLocaleDateString('el-GR'));
  console.log('Today day of week:', today.getDay()); // 0 = Sunday, 1 = Monday, etc.
  console.log('Today day name:', ['Κυριακή', 'Δευτέρα', 'Τρίτη', 'Τετάρτη', 'Πέμπτη', 'Παρασκευή', 'Σάββατο'][today.getDay()]);
  
  // Simulate activation date (example: today)
  const activationDate = new Date(today);
  console.log('Activation date:', activationDate.toLocaleDateString('el-GR'));
  
  // Calculate next refill based on activation + 7 days cycles
  const daysSinceActivation = Math.floor((today.getTime() - activationDate.getTime()) / (24 * 60 * 60 * 1000));
  const weeksSinceActivation = Math.floor(daysSinceActivation / 7);
  const nextRefillDays = (weeksSinceActivation + 1) * 7;
  
  console.log('Days since activation:', daysSinceActivation);
  console.log('Weeks since activation:', weeksSinceActivation);
  console.log('Next refill in days:', nextRefillDays);
  
  const nextRefillDate = new Date(activationDate);
  nextRefillDate.setDate(activationDate.getDate() + nextRefillDays);
  console.log('Next refill date:', nextRefillDate.toLocaleDateString('el-GR'));
  
  // Calculate weeks until refill
  const daysUntilRefill = Math.ceil((nextRefillDate.getTime() - today.getTime()) / (24 * 60 * 60 * 1000));
  const weeksUntilRefill = Math.ceil(daysUntilRefill / 7);
  console.log('Days until refill:', daysUntilRefill);
  console.log('Weeks until refill:', weeksUntilRefill);
  
  // Calculate when user can book from (next day after refill)
  const canBookFromDate = new Date(nextRefillDate);
  canBookFromDate.setDate(nextRefillDate.getDate() + 1);
  console.log('Can book from:', canBookFromDate.toLocaleDateString('el-GR'));
  
  console.log('=== END DEBUG ===');
};
