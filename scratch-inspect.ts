import { loadEnvConfig } from '@next/env'; 
loadEnvConfig('./'); 
import { sql } from './src/lib/db'; 

const run = async () => { 
  try { 
    const info = await sql`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'wallets'`; 
    console.log('Wallets schema:', JSON.stringify(info, null, 2)); 
    
    const info2 = await sql`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'users'`; 
    console.log('Users schema:', JSON.stringify(info2, null, 2)); 
    process.exit(0); 
  } catch(e) { 
    console.error(e); 
    process.exit(1); 
  } 
}; 
run();
