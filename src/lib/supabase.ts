import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ddfybqhamfdkwkreczlw.supabase.co';
const supabaseKey = 'sb_publishable_jIpcYg1-ZActlDUotpWPwA_ueSM5RDn';

export const supabase = createClient(supabaseUrl, supabaseKey);
