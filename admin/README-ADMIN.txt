CUGINIPARTY ADMIN CENTER

File del pannello nel progetto:
admin/index.html
admin/admin.css
admin/admin.js

Il pannello inizializza il client Supabase con la chiave publishable e usa
l'autenticazione/RLS già previste dal progetto.

SQL da eseguire in Supabase:
admin-supabase.sql

IMPORTANTE:
1. Crea un utente Admin in Supabase Auth.
2. Dopo aver creato l'utente, inserisci il suo UUID in public.admin_users.
3. Non mettere mai service_role key nel browser.
4. Questo pacchetto NON fa alcun push su GitHub.
