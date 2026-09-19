/* ========================================
   CUGINIPARTY - SUPABASE
======================================== */

const SUPABASE_URL = "https://pzjbxrcxlztwjxetnzkw.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
    "sb_publishable_obaFQtUNuG3980ZkndTaCQ_bmc4QeHu";


const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
);