-- Public bucket for ElevenLabs-generated narration audio that Shotstack fetches
-- when rendering campaign videos.
INSERT INTO storage.buckets (id, name, public)
VALUES ('campaign-audio', 'campaign-audio', true)
ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'campaign-audio public read'
  ) THEN
    CREATE POLICY "campaign-audio public read" ON storage.objects
      FOR SELECT USING (bucket_id = 'campaign-audio');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'campaign-audio service write'
  ) THEN
    CREATE POLICY "campaign-audio service write" ON storage.objects
      FOR INSERT WITH CHECK (bucket_id = 'campaign-audio');
  END IF;
END $$;
