
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'

// Load .env.local
const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.join(__dirname, '..', '.env.local') })

if (!process.env.VITE_SUPABASE_URL || !process.env.VITE_SUPABASE_ANON_KEY) {
  console.error('Missing Supabase credentials in .env.local')
  process.exit(1)
}

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
)

async function checkEntries() {
  console.log('Connecting to Supabase...')
  const { data, error } = await supabase
    .from('entries')
    .select('*')
    .limit(5)

  if (error) {
    console.error('Error fetching entries:', error)
    fs.writeFileSync('debug_error.txt', JSON.stringify(error, null, 2))
    return
  }

  console.log(`Found ${data.length} entries.`)
  fs.writeFileSync('debug_output.json', JSON.stringify(data, null, 2))
  console.log('Output written to debug_output.json')
}

checkEntries()
