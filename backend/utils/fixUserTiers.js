// Utility to fix all user tiers in the database
import pool from '../db.js';

// Helper to determine tier based on highest_points
function determineLoyaltyTier(highestPoints) {
  if (highestPoints >= 1000) return 'Gold';
  if (highestPoints >= 500) return 'Silver';
  return 'Bronze';
}

// Helper to get tier ID from tier name
function getTierIdFromName(tierName) {
  switch (tierName) {
    case 'Gold': return 3;
    case 'Silver': return 2;
    case 'Bronze': return 1;
    default: return 1;
  }
}

// Fix all user tiers based on their highest_points
async function fixAllUserTiers() {
  const client = await pool.connect();
  
  try {
    console.log('Starting tier fix for all users...');
    
    // Begin transaction
    await client.query('BEGIN');
    
    // Get all users
    const { rows: users } = await client.query('SELECT id, points, highest_points, loyalty_tier FROM users');
    console.log(`Found ${users.length} users to check`);
    
    let fixedCount = 0;
    
    // Process each user
    for (const user of users) {
      // Ensure highest_points is at least equal to current points
      let highestPoints = user.highest_points || 0;
      if (user.points > highestPoints) {
        highestPoints = user.points;
      }
      
      // Calculate correct tier based on highest_points
      const correctTier = determineLoyaltyTier(highestPoints);
      const tierId = getTierIdFromName(correctTier);
      
      // Only update if something needs to change
      if (highestPoints !== user.highest_points || correctTier !== user.loyalty_tier) {
        await client.query(
          'UPDATE users SET highest_points = $1, loyalty_tier = $2, tier_id = $3, last_tier_update = NOW() WHERE id = $4',
          [highestPoints, correctTier, tierId, user.id]
        );
        
        console.log(`Fixed user ${user.id}: highest_points=${highestPoints}, tier=${correctTier}, tier_id=${tierId}`);
        fixedCount++;
      }
    }
    
    // Commit transaction
    await client.query('COMMIT');
    
    console.log(`Tier fix completed. Fixed ${fixedCount} users.`);
    return { success: true, fixedCount, totalUsers: users.length };
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error fixing user tiers:', error);
    return { success: false, error: error.message };
  } finally {
    client.release();
  }
}

export { fixAllUserTiers };
