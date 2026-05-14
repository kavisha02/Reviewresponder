const { createClient } = require('@supabase/supabase-js');


const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixStatuses() {
  console.log("Fixing review statuses...");
  
  const { data, error } = await supabase
    .from('reviews')
    .update({ status: 'published' })
    .not('owner_response', 'is', null)
    .neq('owner_response', '')
    .eq('status', 'new');

  if (error) {
    console.error("Error updating statuses:", error);
  } else {
    console.log("Successfully updated review statuses!");
  }
}

fixStatuses();
