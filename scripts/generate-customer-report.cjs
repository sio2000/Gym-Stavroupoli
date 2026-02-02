const fs = require('fs');
const path = require('path');

// Read the database backup file
const backupPath = path.join(__dirname, '..', 'database.backup');
const backupContent = fs.readFileSync(backupPath, 'utf-8');

// List of fake/temporary email domains used by bots
const FAKE_EMAIL_DOMAINS = [
  'certve.com', 'dpwev.com', 'inupup.com', 'mirarmax.com', 'ncien.com',
  'merumart.com', 'cspaus.com', 'dextrago.com', 'knilok.com', 'freegym.gr',
  'tempmail.com', 'guerrillamail.com', 'mailinator.com', 'throwaway.com',
  'fakeinbox.com', 'sharklasers.com', 'test.com', 'example.com',
  // Additional fake domains from user list
  'fanwn.com', 'ekuali.com', 'reifide.com', 'obirah.com', 'poesd.com',
  'ishense.com', 'kwifa.com', 'camjoint.com', 'cnguopin.com', 'bitfami.com',
  'cerisun.com', 'artvara.com', 'dotxan.com', 'auslank.com', 'protonza.com',
  'mv6a.com', 'djkux.com', 'bdnets.com', 'arqsis.com', 'capiena.com',
  'fanlvr.com', 'memeazon.com', 'lovleo.com', 'keevle.com', 'hh7f.com',
  'haotuwu.com', 'roastic.com', 'naqulu.com', 'arugy.com', 'gamintor.com',
  '24faw.com', 'emaxasp.com', 'gavrom.com', 'atinjo.com', 'elafans.com',
  'daikoa.com', 'oremal.com', 'noihse.com', 'ixunbo.com', 'etenx.com', 'bitmens.com'
];

// Specific bot emails to exclude (manually identified)
const BOT_EMAILS = [
  'xekipo4525@fanwn.com', 'rohat98540@fanwn.com', 'wanol81639@ekuali.com',
  'fehelaj608@reifide.com', 'vipas53780@obirah.com', 'nevew40374@fanwn.com',
  'cikiy35168@obirah.com', 'gomep83008@obirah.com', 'dakasi9882@reifide.com',
  'sorosforos@gmail.com', 'xsiwzos@gmail.com', 'doremo6025@poesd.com',
  'gipacik269@ishense.com', 'kiyina4059@obirah.com', 'tivapo3270@poesd.com',
  'farapeh281@poesd.com', 'yajat95824@ekuali.com', 'tilalor279@ekuali.com',
  'babop26347@poesd.com', 'cesam34075@ishense.com', 'lacafer280@kwifa.com',
  'diyisep787@ekuali.com', 'bexox83442@kwifa.com', 'dofav58946@obirah.com',
  'kiwemav328@ishense.com', 'weceli1412@ishense.com', 'dedane3563@reifide.com',
  'mibogi8027@reifide.com', 'yihoh79194@ishense.com', 'lakamo3379@ekuali.com',
  'pehege4818@fanwn.com', 'zoisiwzou10@gmail.com', 'tenahet357@kwifa.com',
  'nohid58493@ishense.com', 'kikojaf957@ekuali.com', 'killbillkikos@gmail.com',
  'pekop52794@ishense.com', 'givepe9275@ekuali.com', 'xenogog315@ekuali.com',
  'gawak97972@ishense.com', 'vaxideg303@reifide.com', 'kigoher136@fanwn.com',
  'higine9057@kwifa.com', 'milavo3216@reifide.com', 'gisif26531@ishense.com',
  'xogeler124@ekuali.com', 'peheyih281@fanwn.com', 'yoxali7779@ishense.com',
  'wiligod657@kwifa.com', 'rimeyem319@camjoint.com', 'keyimi1836@cnguopin.com',
  'jademad884@bitfami.com', 'gayol74709@cerisun.com', 'ridema3554@cnguopin.com',
  'kehih87510@artvara.com', 'hijede2615@camjoint.com', 'haxibo9552@dotxan.com',
  'wixaji9042@artvara.com', 'jarepih781@cnguopin.com', 'yados51015@bitfami.com',
  'litato4569@camjoint.com', 'vijiket243@bitmens.com', 'todemas831@bitmens.com',
  'sikov33057@etenx.com', 'vimic76438@auslank.com', 'lajape5670@protonza.com',
  'bataw79844@protonza.com', 'kedadi9205@protonza.com', 'manoto7891@protonza.com',
  'laxaxa1019@auslank.com', 'wedob33649@mv6a.com', 'litats569@camjoint.com',
  'vafop25861@djkux.com', 'dipalaj503@bdnets.com', 'xewigo4825@djkux.com',
  'fowosi4044@arqsis.com', 'revefa8817@capiena.com', 'tewis55461@arqsis.com',
  'dexeyit526@arqsis.com', 'paxexi5763@arqsis.com', 'jalami1397@fanlvr.com',
  'lajowa8500@memeazon.com', 'kibod93219@lovleo.com', 'nibebic519@keevle.com',
  'fomer56923@hh7f.com', 'saperi7609@haotuwu.com', 'jajec66862@roastic.com',
  'badatec811@naqulu.com', 'fefesa3627@roastic.com', 'mopeve4024@naqulu.com',
  'jimig30657@naqulu.com', 'xesider452@roastic.com', 'behaw97652@roastic.com',
  'liloh79404@roastic.com', 'kixojad398@naqulu.com', 'wigonev187@arugy.com',
  'nesopap823@gamintor.com', 'lorafib279@24faw.com', 'yeset24076@emaxasp.com',
  'leser87214@gavrom.com', 'mitamih313@emaxasp.com', 'doyixag243@emaxasp.com',
  'giwise3606@gavrom.com', 'caceba5837@emaxasp.com', 'hoyigay532@atinjo.com',
  'kojami9607@elafans.com', 'lefal78132@elafans.com', 'gesedah547@daikoa.com',
  'fataxenan@gmail.com', 'xolaf10376@oremal.com', 'yipoyo9312@noihse.com',
  'letefoj295@noihse.com', 'pihelon564@oremal.com', 'dibiwe8434@noihse.com',
  'ceweb21521@ixunbo.com'
];

// List of suspicious name patterns
const FAKE_NAME_PATTERNS = [
  /^test$/i, /^user$/i, /^bot$/i, /^fake$/i, /^demo$/i,
  /^user\s*\d+$/i, /^test\s*user$/i, /^user\s*one$/i, /^user\s*two$/i,
  /^\d+$/, /^[a-z]{1,3}$/i, /^zzz/i, /^xxx/i, /^aaa/i,
  /^trigger$/i, /^phone$/i, /^updated$/i, /^admin$/i
];

// Check if email is from a fake/temporary domain
function isFakeEmail(email) {
  if (!email) return true;
  const emailLower = email.toLowerCase();
  
  // Check against specific bot emails list
  if (BOT_EMAILS.includes(emailLower)) return true;
  
  // Check for fake domains
  for (const domain of FAKE_EMAIL_DOMAINS) {
    if (emailLower.endsWith('@' + domain)) return true;
  }
  
  // Check for test patterns in email
  if (emailLower.includes('test') && !emailLower.includes('@gmail')) return true;
  if (emailLower.includes('bot@')) return true;
  if (emailLower.includes('fake@')) return true;
  if (emailLower.includes('demo@')) return true;
  
  return false;
}

// Check if name looks fake/bot
function isFakeName(firstName, lastName) {
  const fullName = `${firstName} ${lastName}`.trim();
  const firstLower = (firstName || '').toLowerCase().trim();
  const lastLower = (lastName || '').toLowerCase().trim();
  
  // Check patterns
  for (const pattern of FAKE_NAME_PATTERNS) {
    if (pattern.test(firstLower) || pattern.test(lastLower) || pattern.test(fullName)) {
      return true;
    }
  }
  
  // Check for numeric names
  if (/^\d+$/.test(firstName) || /^\d+$/.test(lastName)) return true;
  
  // Check for very short or repetitive names
  if (firstLower.length <= 2 && lastLower.length <= 2) return true;
  
  return false;
}

// Check if user is legitimate (not a bot)
function isLegitUser(user) {
  // Must have a valid email
  if (!user.email || isFakeEmail(user.email)) return false;
  
  // Check for fake names
  if (isFakeName(user.first_name, user.last_name)) return false;
  
  return true;
}

// Parse user_profiles table
function parseUserProfiles(content) {
  const users = [];
  const profileRegex = /COPY public\.user_profiles.*?FROM stdin;\n([\s\S]*?)\n\\\./;
  const match = content.match(profileRegex);
  
  if (match) {
    const lines = match[1].split('\n').filter(l => l.trim());
    for (const line of lines) {
      const parts = line.split('\t');
      // Columns: id, user_id, first_name, last_name, email, phone, date_of_birth, address, 
      // emergency_contact_name, emergency_contact_phone, language, notification_preferences, 
      // avatar_url, referral_code, role, created_at, updated_at, dob, emergency_contact, 
      // profile_photo, profile_photo_locked, dob_locked, personal_training_code
      if (parts.length >= 16) {
        const role = parts[14];
        // Only include users (not admin, secretary, trainer)
        if (role === 'user') {
          const user = {
            id: parts[0],
            user_id: parts[1],
            first_name: parts[2] || '',
            last_name: parts[3] || '',
            email: parts[4] || '',
            phone: parts[5] && parts[5] !== '\\N' ? parts[5] : '',
            referral_code: parts[13] || '',
            created_at: parts[15] || '',
            role: role
          };
          
          // Only add legitimate users (filter out bots)
          if (isLegitUser(user)) {
            users.push(user);
          }
        }
      }
    }
  }
  return users;
}

// Parse memberships table  
function parseMemberships(content) {
  const memberships = [];
  // Find the main memberships table, not the backup
  const membershipRegex = /COPY public\.memberships \(id.*?\) FROM stdin;\n([\s\S]*?)\n\\\./;
  const match = content.match(membershipRegex);
  
  if (match) {
    const lines = match[1].split('\n').filter(l => l.trim());
    for (const line of lines) {
      const parts = line.split('\t');
      // Columns: id, user_id, package_id, start_date, end_date, is_active, created_at, 
      // updated_at, approved_by, approved_at, duration_type, status, expires_at, 
      // source_request_id, source_package_name
      if (parts.length >= 6) {
        const isActive = parts[5] === 't';
        const endDate = parts[4];
        const durationType = parts[10] || '';
        const packageName = parts[14] || '';
        
        memberships.push({
          id: parts[0],
          user_id: parts[1],
          package_id: parts[2],
          start_date: parts[3],
          end_date: endDate,
          is_active: isActive,
          duration_type: durationType,
          source_package_name: packageName,
          status: parts[11] || ''
        });
      }
    }
  }
  return memberships;
}

// Parse membership_requests for payment totals and installment plans
function parseMembershipRequests(content) {
  const requests = [];
  const requestRegex = /COPY public\.membership_requests \(id.*?\) FROM stdin;\n([\s\S]*?)\n\\\./;
  const match = content.match(requestRegex);
  
  // Cutoff date: January 6, 2026
  const cutoffDate = new Date('2026-01-06');
  
  if (match) {
    const lines = match[1].split('\n').filter(l => l.trim());
    for (const line of lines) {
      const parts = line.split('\t');
      // Columns: id, user_id, package_id, duration_type, requested_price, status, 
      // approved_by, approved_at, rejected_reason, created_at, updated_at, classes_count,
      // has_installments, installment_1_amount, installment_2_amount, installment_3_amount,
      // installment_1_payment_method, installment_2_payment_method, installment_3_payment_method,
      // installment_1_paid, installment_2_paid, installment_3_paid, ...
      if (parts.length >= 12) {
        const status = parts[5];
        const price = parseFloat(parts[4]) || 0;
        const hasInstallments = parts[12] === 't';
        const createdAt = parts[9] && parts[9] !== '\\N' ? parts[9] : '';
        
        // Check if created after cutoff date for installments
        let isAfterCutoff = false;
        if (createdAt) {
          const createdDate = new Date(createdAt);
          isAfterCutoff = createdDate >= cutoffDate;
        }
        
        requests.push({
          id: parts[0],
          user_id: parts[1],
          package_id: parts[2],
          duration_type: parts[3],
          requested_price: price,
          status: status,
          created_at: createdAt,
          is_after_cutoff: isAfterCutoff,
          has_installments: hasInstallments,
          installment_1_amount: parseFloat(parts[13]) || 0,
          installment_2_amount: parseFloat(parts[14]) || 0,
          installment_3_amount: parseFloat(parts[15]) || 0,
          installment_1_paid: parts[19] === 't',
          installment_2_paid: parts[20] === 't',
          installment_3_paid: parts[21] === 't',
          installment_1_due_date: parts[27] && parts[27] !== '\\N' ? parts[27] : '',
          installment_2_due_date: parts[28] && parts[28] !== '\\N' ? parts[28] : '',
          installment_3_due_date: parts[29] && parts[29] !== '\\N' ? parts[29] : ''
        });
      }
    }
  }
  return requests;
}

// Calculate user payment totals and installment plans
function calculateUserPayments(requests) {
  const userPayments = {};
  const userInstallments = {};
  
  for (const req of requests) {
    // Only count approved requests for total payment
    if (req.status === 'approved') {
      if (!userPayments[req.user_id]) {
        userPayments[req.user_id] = 0;
      }
      userPayments[req.user_id] += req.requested_price;
    }
    
    // Check for installment plans - ONLY if created after January 6, 2026
    if (req.has_installments && req.is_after_cutoff && (req.installment_1_amount > 0 || req.installment_2_amount > 0 || req.installment_3_amount > 0)) {
      if (!userInstallments[req.user_id]) {
        userInstallments[req.user_id] = [];
      }
      userInstallments[req.user_id].push({
        total: req.requested_price,
        installment_1: { amount: req.installment_1_amount, paid: req.installment_1_paid, due_date: req.installment_1_due_date },
        installment_2: { amount: req.installment_2_amount, paid: req.installment_2_paid, due_date: req.installment_2_due_date },
        installment_3: { amount: req.installment_3_amount, paid: req.installment_3_paid, due_date: req.installment_3_due_date }
      });
    }
  }
  
  return { userPayments, userInstallments };
}


// Get membership type name in Greek
function getMembershipName(durationType, packageName) {
  if (packageName && packageName !== '\\N') {
    return packageName;
  }
  
  const types = {
    'year': 'Ετήσια Συνδρομή Γυμναστηρίου',
    'semester': 'Εξάμηνη Συνδρομή Γυμναστηρίου',
    'month': 'Μηνιαία Συνδρομή Γυμναστηρίου',
    '3 Μήνες': 'Τρίμηνη Συνδρομή Γυμναστηρίου',
    'lesson': 'Μάθημα',
    'pilates_trial': 'Pilates Δοκιμαστικό',
    'pilates_1month': 'Pilates 1 Μήνας',
    'pilates_2months': 'Pilates 2 Μήνες',
    'pilates_3months': 'Pilates 3 Μήνες',
    'pilates_6months': 'Pilates 6 Μήνες',
    'pilates_1year': 'Pilates 1 Έτος',
    'ultimate_1year': 'Ultimate Πακέτο (Ετήσιο)',
    'ultimate_medium_1year': 'Ultimate Medium (Ετήσιο)'
  };
  
  return types[durationType] || durationType || 'Άγνωστο';
}

// Format date to Greek format
function formatDate(dateStr) {
  if (!dateStr || dateStr === '\\N') return '';
  try {
    let date;
    
    // Handle simple ISO date format (YYYY-MM-DD)
    if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const [year, month, day] = dateStr.split('-');
      date = new Date(year, month - 1, day);
    } 
    // Handle ISO date with time and timezone (2026-01-29T00:00:00+00)
    else if (dateStr.match(/^\d{4}-\d{2}-\d{2}T/)) {
      const datePart = dateStr.split('T')[0];
      const [year, month, day] = datePart.split('-');
      date = new Date(year, month - 1, day);
    }
    else {
      date = new Date(dateStr);
    }
    
    if (isNaN(date.getTime())) return dateStr;
    return date.toLocaleDateString('el-GR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  } catch {
    return dateStr;
  }
}

// Generate HTML report
function generateHTMLReport(users, memberships, userPayments, userInstallments) {
  // Cutoff date for memberships: January 6, 2026
  const membershipCutoffDate = new Date('2026-01-06');
  
  // Create a map of user_id to active memberships
  const userMemberships = {};
  for (const m of memberships) {
    if (m.is_active && m.status === 'active') {
      // Filter out memberships that expire before January 6, 2026
      if (m.end_date && m.end_date !== '\\N') {
        const endDate = new Date(m.end_date);
        if (endDate < membershipCutoffDate) {
          continue; // Skip this membership
        }
      }
      
      if (!userMemberships[m.user_id]) {
        userMemberships[m.user_id] = [];
      }
      // Don't add duplicates
      const exists = userMemberships[m.user_id].some(
        existing => existing.duration_type === m.duration_type && existing.end_date === m.end_date
      );
      if (!exists) {
        userMemberships[m.user_id].push(m);
      }
    }
  }
  
  // Sort users by created_at
  users.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  
  let html = `<!DOCTYPE html>
<html lang="el">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Αναφορά Πελατών - GetFit</title>
  <style>
    @page {
      size: A4;
      margin: 20mm;
    }
    body {
      font-family: 'Segoe UI', Arial, sans-serif;
      font-size: 11pt;
      line-height: 1.4;
      color: #333;
      max-width: 210mm;
      margin: 0 auto;
      padding: 20px;
    }
    h1 {
      text-align: center;
      color: #2c3e50;
      border-bottom: 2px solid #3498db;
      padding-bottom: 10px;
      margin-bottom: 30px;
    }
    .customer {
      background: #f9f9f9;
      border: 1px solid #ddd;
      border-radius: 8px;
      padding: 15px;
      margin-bottom: 20px;
      page-break-inside: avoid;
    }
    .customer-header {
      font-size: 14pt;
      font-weight: bold;
      color: #2c3e50;
      margin-bottom: 10px;
      border-bottom: 1px solid #bdc3c7;
      padding-bottom: 5px;
    }
    .customer-number {
      color: #7f8c8d;
      font-size: 10pt;
    }
    .field {
      margin: 6px 0;
    }
    .field-label {
      font-weight: bold;
      color: #555;
      display: inline-block;
      width: 160px;
    }
    .field-value {
      color: #333;
    }
    .no-value {
      color: #999;
      font-style: italic;
    }
    .membership-section {
      background: #e8f5e9;
      border-radius: 5px;
      padding: 10px;
      margin-top: 10px;
    }
    .membership-section h4 {
      margin: 0 0 8px 0;
      color: #27ae60;
      font-size: 11pt;
    }
    .installment-section {
      background: #fff3e0;
      border-radius: 5px;
      padding: 10px;
      margin-top: 10px;
    }
    .installment-section h4 {
      margin: 0 0 8px 0;
      color: #e65100;
      font-size: 11pt;
    }
    .paid {
      color: #27ae60;
      font-weight: bold;
    }
    .pending {
      color: #e74c3c;
    }
    .summary {
      background: #3498db;
      color: white;
      padding: 15px;
      border-radius: 8px;
      margin-bottom: 30px;
      text-align: center;
    }
    .summary h2 {
      margin: 0;
    }
    .print-date {
      text-align: right;
      color: #7f8c8d;
      font-size: 10pt;
      margin-bottom: 20px;
    }
    @media print {
      body { padding: 0; }
      .customer { break-inside: avoid; }
    }
  </style>
</head>
<body>
  <div class="print-date">Ημερομηνία εκτύπωσης: ${formatDate(new Date().toISOString())}</div>
  
  <h1>Αναφορά Πελατών - GetFit</h1>
  
  <div class="summary">
    <h2>Σύνολο Πελατών: ${users.length}</h2>
  </div>
`;

  let customerNumber = 1;
  for (const user of users) {
    const activeMemberships = userMemberships[user.user_id] || [];
    const installments = userInstallments[user.user_id] || [];
    
    // Check if this is a manual user with direct membership info
    // Also filter out manual memberships that expire before January 6, 2026
    const membershipCutoff = new Date('2026-01-06');
    let hasManualMembership = user.membership && user.membership.name;
    if (hasManualMembership && user.membership.end_date) {
      const endDate = new Date(user.membership.end_date);
      if (endDate < membershipCutoff) {
        hasManualMembership = false;
      }
    }
    
    html += `
  <div class="customer">
    <div class="customer-header">
      <span class="customer-number">#${customerNumber}</span> 
      ${user.first_name} ${user.last_name}
    </div>
    
    <div class="field">
      <span class="field-label">Όνομα:</span>
      <span class="field-value">${user.first_name} ${user.last_name}</span>
    </div>
    
    <div class="field">
      <span class="field-label">Email:</span>
      <span class="field-value">${user.email || '<span class="no-value">Δεν υπάρχει</span>'}</span>
    </div>
    
    <div class="field">
      <span class="field-label">Τηλέφωνο:</span>
      <span class="field-value">${user.phone ? user.phone : '<span class="no-value">Δεν υπάρχει</span>'}</span>
    </div>
    
    <div class="field">
      <span class="field-label">Εγγραφή:</span>
      <span class="field-value">${formatDate(user.created_at)}</span>
    </div>
    
    <div class="field">
      <span class="field-label">Κωδικός Παραπομπής:</span>
      <span class="field-value">${user.referral_code || '<span class="no-value">Δεν υπάρχει</span>'}</span>
    </div>
    
`;
    
    // Add manual user membership
    if (hasManualMembership) {
      html += `
    <div class="membership-section">
      <h4>Ενεργή Συνδρομή</h4>
      <div class="field">
        <span class="field-label">Τύπος:</span>
        <span class="field-value">${user.membership.name}</span>
      </div>
      <div class="field">
        <span class="field-label">Λήξη Συνδρομής:</span>
        <span class="field-value">${formatDate(user.membership.end_date)}</span>
      </div>
    </div>`;
    }
    // Add active memberships from database
    else if (activeMemberships.length > 0) {
      // Get unique memberships (avoiding duplicates)
      const uniqueMemberships = [];
      const seen = new Set();
      
      for (const m of activeMemberships) {
        const key = `${m.duration_type}-${m.end_date}`;
        if (!seen.has(key)) {
          seen.add(key);
          uniqueMemberships.push(m);
        }
      }
      
      html += `
    <div class="membership-section">
      <h4>Ενεργή Συνδρομή</h4>`;
      
      for (const m of uniqueMemberships) {
        const membershipName = getMembershipName(m.duration_type, m.source_package_name);
        html += `
      <div class="field">
        <span class="field-label">Τύπος:</span>
        <span class="field-value">${membershipName}</span>
      </div>
      <div class="field">
        <span class="field-label">Λήξη Συνδρομής:</span>
        <span class="field-value">${formatDate(m.end_date)}</span>
      </div>`;
      }
      
      html += `
    </div>`;
    }
    
    // Add installment plans if they exist
    if (installments.length > 0) {
      for (const plan of installments) {
        // Only show if there are actual installments with amounts > 0
        if (plan.installment_1.amount > 0 || plan.installment_2.amount > 0 || plan.installment_3.amount > 0) {
          html += `
    <div class="installment-section">
      <h4>Πλάνο Δόσεων</h4>
      <div class="field">
        <span class="field-label">Συνολικό Ποσό:</span>
        <span class="field-value">€${plan.total.toFixed(2)}</span>
      </div>`;
          
          if (plan.installment_1.amount > 0) {
            html += `
      <div class="field">
        <span class="field-label">1η Δόση:</span>
        <span class="field-value">€${plan.installment_1.amount.toFixed(2)} <span class="${plan.installment_1.paid ? 'paid' : 'pending'}">${plan.installment_1.paid ? '(Πληρώθηκε)' : '(Εκκρεμεί)'}</span>${plan.installment_1.due_date ? ' - ' + formatDate(plan.installment_1.due_date) : ''}</span>
      </div>`;
          }
          
          if (plan.installment_2.amount > 0) {
            html += `
      <div class="field">
        <span class="field-label">2η Δόση:</span>
        <span class="field-value">€${plan.installment_2.amount.toFixed(2)} <span class="${plan.installment_2.paid ? 'paid' : 'pending'}">${plan.installment_2.paid ? '(Πληρώθηκε)' : '(Εκκρεμεί)'}</span>${plan.installment_2.due_date ? ' - ' + formatDate(plan.installment_2.due_date) : ''}</span>
      </div>`;
          }
          
          if (plan.installment_3.amount > 0) {
            html += `
      <div class="field">
        <span class="field-label">3η Δόση:</span>
        <span class="field-value">€${plan.installment_3.amount.toFixed(2)} <span class="${plan.installment_3.paid ? 'paid' : 'pending'}">${plan.installment_3.paid ? '(Πληρώθηκε)' : '(Εκκρεμεί)'}</span>${plan.installment_3.due_date ? ' - ' + formatDate(plan.installment_3.due_date) : ''}</span>
      </div>`;
          }
          
          html += `
    </div>`;
        }
      }
    }
    
    html += `
  </div>`;
    
    customerNumber++;
  }
  
  html += `
</body>
</html>`;
  
  return html;
}

// Manual users that need to be added (recent registrations not in backup)
const manualUsers = [
  {
    user_id: 'manual-1',
    first_name: 'Βασιλης',
    last_name: 'Νοβακιδης',
    email: 'billnovakidis@gmail.com',
    phone: '6978051342',
    referral_code: 'AD37500C',
    created_at: '2026-01-29T00:00:00+00',
    membership: { name: 'Free Gym', end_date: '2026-04-28' },
    totalPaid: 99.00
  },
  {
    user_id: 'manual-2',
    first_name: 'Κωνσταντινα',
    last_name: 'Θεοδωρακου',
    email: 'theodorakoukonstantina@gmail.com',
    phone: '6948494055',
    referral_code: '2E6B873E',
    created_at: '2026-01-28T00:00:00+00',
    membership: null,
    totalPaid: 0
  },
  {
    user_id: 'manual-3',
    first_name: 'Βικη',
    last_name: 'Κρητοπουλου',
    email: 'vikikrit93@gmail.com',
    phone: '6983348118',
    referral_code: 'BBF860AD',
    created_at: '2026-01-28T00:00:00+00',
    membership: null,
    totalPaid: 0
  },
  {
    user_id: 'manual-4',
    first_name: 'Νικολαος',
    last_name: 'Ερμειδης',
    email: 'nikoserm93@gmail.com',
    phone: '6980289023',
    referral_code: '5A2B00C5',
    created_at: '2026-01-28T00:00:00+00',
    membership: null,
    totalPaid: 0
  },
  {
    user_id: 'manual-5',
    first_name: 'Θεοδωρος',
    last_name: 'Βελκος',
    email: 'todorvelkos@gmai.com',
    phone: '6937232250',
    referral_code: '34A8E9EB',
    created_at: '2026-01-28T00:00:00+00',
    membership: { name: 'Free Gym', end_date: '2026-04-27' },
    totalPaid: 99.00
  },
  {
    user_id: 'manual-6',
    first_name: 'Penka',
    last_name: 'Velkova',
    email: 'velkovapenka@gmail.com',
    phone: '6976918239',
    referral_code: 'D949E167',
    created_at: '2026-01-28T00:00:00+00',
    membership: { name: 'Free Gym', end_date: '2026-04-27' },
    totalPaid: 99.00
  },
  {
    user_id: 'manual-7',
    first_name: 'Λια',
    last_name: 'Σαββα',
    email: 'liasavva@gmail.com',
    phone: '6974471501',
    referral_code: 'DC51A1A3',
    created_at: '2026-01-28T00:00:00+00',
    membership: { name: 'Pilates', end_date: '2026-04-27' },
    totalPaid: 120.00
  },
  {
    user_id: 'manual-8',
    first_name: 'Μαρινα',
    last_name: 'Γουλουτη',
    email: 'marinagoul6@gmail.com',
    phone: '6984905743',
    referral_code: '3BDA7238',
    created_at: '2026-01-28T00:00:00+00',
    membership: { name: 'Pilates', end_date: '2026-04-27' },
    totalPaid: 0
  },
  {
    user_id: 'manual-9',
    first_name: 'Εριεττα',
    last_name: 'Μελισσα',
    email: 'eriettamelissa96@outlook.com.gr',
    phone: '6970278277',
    referral_code: 'F76CDA5A',
    created_at: '2026-01-28T00:00:00+00',
    membership: { name: 'Free Gym', end_date: '2026-04-17' },
    totalPaid: 0
  },
  {
    user_id: 'manual-10',
    first_name: 'Κωνσταντινος',
    last_name: 'Νοβακιδης',
    email: 'novaskostas@gmail.com',
    phone: '6949631109',
    referral_code: '80DD080E',
    created_at: '2026-01-28T00:00:00+00',
    membership: { name: 'Free Gym', end_date: '2026-04-27' },
    totalPaid: 99.00
  },
  {
    user_id: 'manual-11',
    first_name: 'Ολγα',
    last_name: 'Ταταμιδου',
    email: 'tatamidouo00@gmail.com',
    phone: '6975841163',
    referral_code: '53AA7FF0',
    created_at: '2026-01-27T00:00:00+00',
    membership: null,
    totalPaid: 0
  },
  {
    user_id: 'manual-12',
    first_name: 'Ελενη',
    last_name: 'Ραπτιδου',
    email: 'eleniraptidou@gmail.com',
    phone: '6978648986',
    referral_code: '1E7A35E3',
    created_at: '2026-01-27T00:00:00+00',
    membership: null,
    totalPaid: 0
  }
];

// Main execution
console.log('Parsing database backup...');

const users = parseUserProfiles(backupContent);

// Add manual users
users.push(...manualUsers);

console.log(`Found ${users.length} legitimate users (filtered out bots/test accounts, added ${manualUsers.length} manual users)`);

const memberships = parseMemberships(backupContent);
console.log(`Found ${memberships.length} memberships`);

const membershipRequests = parseMembershipRequests(backupContent);
console.log(`Found ${membershipRequests.length} membership requests`);

const { userPayments, userInstallments } = calculateUserPayments(membershipRequests);
console.log(`Calculated payments for ${Object.keys(userPayments).length} users`);
console.log(`Found installment plans for ${Object.keys(userInstallments).length} users`);

console.log('Generating HTML report...');
const htmlReport = generateHTMLReport(users, memberships, userPayments, userInstallments);

// Save the HTML file
const outputPath = path.join(__dirname, '..', 'docs', 'customer-report.html');
fs.writeFileSync(outputPath, htmlReport, 'utf-8');

console.log(`\nReport generated successfully!`);
console.log(`Output file: ${outputPath}`);
console.log(`\nTo create a PDF:`);
console.log(`1. Open the HTML file in a browser`);
console.log(`2. Press Ctrl+P (or Cmd+P on Mac)`);
console.log(`3. Select "Save as PDF" as the destination`);
console.log(`4. Click Save`);
