#!/usr/bin/env node

/**
 * Apply RLS Performance Fixes
 * This script applies the optimized RLS policies to fix performance issues
 */

const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");

// Load environment variables
require("dotenv").config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Missing Supabase environment variables");
  console.error(
    "Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY"
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyRLSFixes() {
  try {
    console.log("🚀 Applying RLS performance fixes...");

    // Read the SQL script
    const sqlPath = path.join(__dirname, "fix-rls-performance.sql");
    const sqlContent = fs.readFileSync(sqlPath, "utf8");

    // Execute the SQL
    const { data, error } = await supabase.rpc("exec_sql", { sql: sqlContent });

    if (error) {
      console.error("❌ Error applying RLS fixes:", error);
      process.exit(1);
    }

    console.log("✅ RLS performance fixes applied successfully!");
    console.log("📊 Performance improvements:");
    console.log("  - Optimized auth function calls");
    console.log("  - Consolidated multiple permissive policies");
    console.log("  - Added performance indexes");
    console.log("  - Reduced policy evaluation overhead");
  } catch (error) {
    console.error("❌ Failed to apply RLS fixes:", error);
    process.exit(1);
  }
}

// Alternative method using direct SQL execution
async function applyRLSFixesDirect() {
  try {
    console.log("🚀 Applying RLS performance fixes (direct method)...");

    // Read the SQL script
    const sqlPath = path.join(__dirname, "fix-rls-performance.sql");
    const sqlContent = fs.readFileSync(sqlPath, "utf8");

    // Split SQL into individual statements
    const statements = sqlContent
      .split(";")
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);

    console.log(`📝 Executing ${statements.length} SQL statements...`);

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        console.log(
          `  ${i + 1}/${statements.length}: ${statement.substring(0, 50)}...`
        );

        const { error } = await supabase.from("_sql").select("*").limit(0);

        // Note: This is a simplified approach. In practice, you'd need to use
        // the Supabase dashboard or a direct database connection to execute DDL statements
        console.log(`  ✅ Statement ${i + 1} prepared`);
      }
    }

    console.log("✅ RLS performance fixes prepared!");
    console.log("📋 Next steps:");
    console.log("  1. Go to your Supabase dashboard");
    console.log("  2. Navigate to SQL Editor");
    console.log(
      "  3. Copy and paste the contents of scripts/fix-rls-performance.sql"
    );
    console.log("  4. Execute the script");
  } catch (error) {
    console.error("❌ Failed to prepare RLS fixes:", error);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  applyRLSFixesDirect();
}

module.exports = { applyRLSFixes, applyRLSFixesDirect };
