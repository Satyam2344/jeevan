
-- KYC submissions table
CREATE TABLE public.kyc_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  document_type text NOT NULL DEFAULT 'aadhaar',
  document_number text,
  document_front_url text,
  document_back_url text,
  selfie_url text,
  status text NOT NULL DEFAULT 'pending',
  admin_notes text,
  reviewed_by text,
  reviewed_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.kyc_submissions ENABLE ROW LEVEL SECURITY;

-- Users can view their own submissions
CREATE POLICY "Users can view own kyc" ON public.kyc_submissions
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Users can insert their own submissions
CREATE POLICY "Users can submit kyc" ON public.kyc_submissions
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Admins can do everything
CREATE POLICY "Admins can manage kyc" ON public.kyc_submissions
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Create storage bucket for KYC documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('kyc-documents', 'kyc-documents', false, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']);

-- Storage policies: users can upload to their own folder
CREATE POLICY "Users upload own kyc docs" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'kyc-documents' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Users can view their own docs
CREATE POLICY "Users view own kyc docs" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'kyc-documents' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Admins can view all kyc docs
CREATE POLICY "Admins view all kyc docs" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'kyc-documents' AND public.has_role(auth.uid(), 'admin'));
