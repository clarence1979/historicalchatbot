CREATE TABLE shared_characters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  share_slug text UNIQUE NOT NULL,
  character_data jsonb NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE shared_characters ENABLE ROW LEVEL SECURITY;

-- Public read — share links are intentionally accessible to anyone with the URL
CREATE POLICY "read_shared_characters" ON shared_characters
  FOR SELECT TO anon, authenticated USING (true);

-- Any visitor can create a share link (app uses anon key, not Supabase Auth)
CREATE POLICY "insert_shared_characters" ON shared_characters
  FOR INSERT TO anon, authenticated WITH CHECK (true);
