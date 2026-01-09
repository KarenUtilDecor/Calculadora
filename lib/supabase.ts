import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fgywsxqettxqvjnecube.supabase.co';
const supabaseAnonKey = 'sb_publishable_lDdJL8MxOtlUsjimjuJIDw_BCT4VkfF';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
