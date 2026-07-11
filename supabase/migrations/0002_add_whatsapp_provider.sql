-- Mtalkz SMS requires DLT sender-id registration (pending); WhatsApp Cloud API is the working
-- notification channel in the meantime. See supabase/functions/trigger-sms/whatsapp.ts.
alter type message_provider add value 'whatsapp';
