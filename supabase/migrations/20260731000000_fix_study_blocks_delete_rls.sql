-- Ensure study_blocks table enforces strict owner check for DELETE queries
ALTER TABLE study_blocks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can delete own study blocks" ON study_blocks;

CREATE POLICY "Users can delete own study blocks"
  ON study_blocks
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);