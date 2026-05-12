// Migration runner to update transaction prices to effective prices
import { sql } from './src/lib/db.js';

async function migrateTransactionPrices() {
  try {
    console.log('Starting transaction price migration...');
    
    // First, check what needs to be updated
    const checkResult = await sql`
      SELECT 
        t.id,
        t.amount as current_amount,
        t.reference,
        t.metadata->>'capacity' as capacity,
        db.price as provider_price,
        db.price_override,
        db.markup_percent,
        CASE 
          WHEN db.price_override IS NOT NULL AND db.price_override > 0 THEN db.price_override
          WHEN db.markup_percent IS NOT NULL AND db.markup_percent > 0 
            THEN ROUND(db.price + (db.price * db.markup_percent / 100), 2)
          ELSE db.price
        END as effective_price
      FROM transactions t
      LEFT JOIN data_bundles db ON t.metadata->>'capacity' = db.datamart_plan_id
      WHERE t.type = 'data'
        AND t.status = 'success'
        AND t.metadata->>'capacity' IS NOT NULL
      LIMIT 10
    `;
    
    console.log('Sample transactions to check:');
    console.table(checkResult);
    
    // Update transactions with effective prices
    const updateResult = await sql`
      UPDATE transactions t
      SET 
        amount = CASE 
          WHEN db.price_override IS NOT NULL AND db.price_override > 0 THEN db.price_override
          WHEN db.markup_percent IS NOT NULL AND db.markup_percent > 0 
            THEN ROUND(db.price + (db.price * db.markup_percent / 100), 2)
          ELSE db.price
        END,
        updated_at = NOW()
      FROM data_bundles db
      WHERE t.type = 'data'
        AND t.status = 'success'
        AND t.metadata->>'capacity' IS NOT NULL
        AND t.metadata->>'capacity' = db.datamart_plan_id
        AND t.amount != CASE 
          WHEN db.price_override IS NOT NULL AND db.price_override > 0 THEN db.price_override
          WHEN db.markup_percent IS NOT NULL AND db.markup_percent > 0 
            THEN ROUND(db.price + (db.price * db.markup_percent / 100), 2)
          ELSE db.price
        END
      RETURNING t.id, t.amount
    `;
    
    console.log(`✅ Updated ${updateResult.length} transactions`);
    console.log('Migration completed successfully');
    
    // Verify the update
    const verifyResult = await sql`
      SELECT 
        COUNT(*) as total_data_transactions,
        AVG(amount) as avg_amount
      FROM transactions t
      WHERE t.type = 'data'
        AND t.status = 'success'
        AND t.metadata->>'capacity' IS NOT NULL
    `;
    
    console.log('\n📊 Verification:');
    console.log(`  Total data transactions: ${verifyResult[0].total_data_transactions}`);
    console.log(`  Average amount: GH¢${verifyResult[0].avg_amount}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrateTransactionPrices();
