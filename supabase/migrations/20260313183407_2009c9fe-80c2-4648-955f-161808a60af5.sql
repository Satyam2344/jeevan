ALTER TABLE public.cricket_matches 
ADD COLUMN result_set_by text DEFAULT NULL,
ADD COLUMN result_set_at timestamp with time zone DEFAULT NULL;