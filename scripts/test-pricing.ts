import { 
  getConferenceTicketStatus, 
  canPurchaseTickets, 
  getVerifiedPriceCents,
  getVerifiedTierName,
  EARLY_BIRD_END_TIMESTAMP,
  SALES_CLOSE_TIMESTAMP
} from 'c:/Users/haven/Desktop/ABG-Website 2026/ABGWebsite/src/lib/conference-pricing';

console.log('----------------------------------------------------');
console.log('CONFERENCE PRICING SCHEDULE VALIDATION');
console.log('----------------------------------------------------');

// Test 1: Current date (Sep 15, 2026) -> Should be Early Bird $13
const currentStatus = getConferenceTicketStatus();
console.log('1. Current Date (Sep 15, 2026):', {
  phase: currentStatus.phase,
  price: currentStatus.priceLabel,
  tier: currentStatus.tierName,
  isAvailable: currentStatus.isAvailable,
});
if (currentStatus.phase !== 'EARLY_BIRD' || currentStatus.price !== 13) {
  throw new Error('Test 1 failed: Current date should be Early Bird $13');
}

// Test 2: Just before Early Bird deadline (Sunday Sep 20, 2026 11:59 PM EDT)
const beforeEarlyBird = getConferenceTicketStatus(EARLY_BIRD_END_TIMESTAMP - 1000);
console.log('2. Sun Sep 20, 2026 11:59:59 PM EDT:', {
  phase: beforeEarlyBird.phase,
  price: beforeEarlyBird.priceLabel,
  tier: beforeEarlyBird.tierName,
});
if (beforeEarlyBird.phase !== 'EARLY_BIRD' || beforeEarlyBird.price !== 13) {
  throw new Error('Test 2 failed: Should still be Early Bird $13');
}

// Test 3: Exactly at Early Bird transition (Mon Sep 21, 2026 00:00:00 EDT)
const atGeneral = getConferenceTicketStatus(EARLY_BIRD_END_TIMESTAMP);
console.log('3. Mon Sep 21, 2026 00:00:00 EDT:', {
  phase: atGeneral.phase,
  price: atGeneral.priceLabel,
  tier: atGeneral.tierName,
  isAvailable: atGeneral.isAvailable,
});
if (atGeneral.phase !== 'GENERAL' || atGeneral.price !== 17) {
  throw new Error('Test 3 failed: Should switch to General Admission $17');
}

// Test 4: During General Admission (Oct 10, 2026)
const duringGeneral = getConferenceTicketStatus(new Date('2026-10-10T12:00:00-04:00').getTime());
console.log('4. Oct 10, 2026 (Mid-General):', {
  phase: duringGeneral.phase,
  price: duringGeneral.priceLabel,
  tier: duringGeneral.tierName,
});
if (duringGeneral.phase !== 'GENERAL' || duringGeneral.price !== 17) {
  throw new Error('Test 4 failed: Should be General Admission $17');
}

// Test 5: Just before cutoff (Thu Oct 22, 2026 07:59:59 AM EDT)
const beforeCutoff = getConferenceTicketStatus(SALES_CLOSE_TIMESTAMP - 1000);
console.log('5. Thu Oct 22, 2026 07:59:59 AM EDT:', {
  phase: beforeCutoff.phase,
  isAvailable: beforeCutoff.isAvailable,
});
if (!beforeCutoff.isAvailable) {
  throw new Error('Test 5 failed: Should still be available before 8:00 AM EDT');
}

// Test 6: At and after cutoff (Thu Oct 22, 2026 08:00:00 AM EDT)
const afterCutoff = getConferenceTicketStatus(SALES_CLOSE_TIMESTAMP);
console.log('6. Thu Oct 22, 2026 08:00:00 AM EDT (Cutoff):', {
  phase: afterCutoff.phase,
  tier: afterCutoff.tierName,
  isAvailable: afterCutoff.isAvailable,
});
if (afterCutoff.phase !== 'CLOSED' || afterCutoff.isAvailable !== false) {
  throw new Error('Test 6 failed: Should be CLOSED and unavailable');
}

console.log('----------------------------------------------------');
console.log('ALL PRICING & CUTOFF TESTS PASSED SUCCESSFULLY! ✅');
console.log('----------------------------------------------------');
