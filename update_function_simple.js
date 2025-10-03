import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://nolqodpfaqdnprixaqlo.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vbHFvZHBmYXFkbnByaXhhcWxvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzE3MTEzNiwiZXhwIjoyMDcyNzQ3MTM2fQ.ZalT8VkD9CeTpWWZ66LDW20l8UKjpblQkSDfQc9DVA0'
);

async function updateFunction() {
  console.log('Updating delete_third_installment_permanently function...');
  
  const sql = `
    CREATE OR REPLACE FUNCTION delete_third_installment_permanently(
      p_request_id UUID,
      p_deleted_by UUID DEFAULT NULL
    )
    RETURNS BOOLEAN
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $$
    BEGIN
      -- Update membership_requests table
      UPDATE membership_requests 
      SET 
        installment_3_locked = TRUE,
        third_installment_deleted = TRUE,
        third_installment_deleted_at = NOW(),
        third_installment_deleted_by = p_deleted_by
      WHERE id = p_request_id;

      RETURN TRUE;
    END;
    $$;
  `;

  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql });
    if (error) {
      console.error('Error updating function:', error);
    } else {
      console.log('Function updated successfully:', data);
    }
  } catch (err) {
    console.error('Exception:', err);
  }
}

updateFunction();
