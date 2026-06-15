import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL || "postgresql://neondb_owner:npg_CdErv90DWHzP@ep-divine-frog-ahe05se1-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require");

async function removeDuplicates() {
  try {
    // Get all services to identify duplicates
    const allServices = await sql`
      SELECT id, title, href, is_active 
      FROM homepage_services 
      WHERE is_active = TRUE
      ORDER BY title, id
    `;
    console.log('All homepage services before deduplication:');
    console.table(allServices);
    
    // Group by title and keep only the first ID
    const seenTitles = new Set();
    const idsToDelete = [];
    
    for (const service of allServices) {
      if (seenTitles.has(service.title)) {
        idsToDelete.push(service.id);
      } else {
        seenTitles.add(service.title);
      }
    }
    
    console.log('IDs to delete:', idsToDelete);
    
    if (idsToDelete.length > 0) {
      const result = await sql`
        DELETE FROM homepage_services 
        WHERE id = ANY(${idsToDelete})
      `;
      console.log('Successfully removed duplicate homepage services');
      console.log('Rows affected:', result.length);
    } else {
      console.log('No duplicates found');
    }
    
    // Verify removal
    const remainingServices = await sql`
      SELECT id, title, href, is_active 
      FROM homepage_services 
      WHERE is_active = TRUE
      ORDER BY priority ASC
    `;
    console.log('Remaining homepage services:');
    console.table(remainingServices);
  } catch (err) {
    console.error('Error:', err);
  }
}

removeDuplicates();
