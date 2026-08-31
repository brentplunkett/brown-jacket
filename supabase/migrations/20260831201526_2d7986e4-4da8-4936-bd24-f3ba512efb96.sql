CREATE TABLE public.hole_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  round_key text NOT NULL,
  hole int NOT NULL CHECK (hole BETWEEN 1 AND 18),
  player text NOT NULL,
  strokes int CHECK (strokes BETWEEN 1 AND 20),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (round_key, hole, player)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.hole_scores TO authenticated;
GRANT ALL ON public.hole_scores TO service_role;
ALTER TABLE public.hole_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "signed in can read scores" ON public.hole_scores FOR SELECT TO authenticated USING (true);
CREATE POLICY "signed in can write scores" ON public.hole_scores FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "signed in can update scores" ON public.hole_scores FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "signed in can delete scores" ON public.hole_scores FOR DELETE TO authenticated USING (true);

CREATE TABLE public.wolf_calls (
  hole int PRIMARY KEY CHECK (hole BETWEEN 1 AND 18),
  wolf text NOT NULL,
  partner text,
  blind boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.wolf_calls TO authenticated;
GRANT ALL ON public.wolf_calls TO service_role;
ALTER TABLE public.wolf_calls ENABLE ROW LEVEL SECURITY;
CREATE POLICY "signed in can read wolf" ON public.wolf_calls FOR SELECT TO authenticated USING (true);
CREATE POLICY "signed in can insert wolf" ON public.wolf_calls FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "signed in can update wolf" ON public.wolf_calls FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "signed in can delete wolf" ON public.wolf_calls FOR DELETE TO authenticated USING (true);

CREATE TABLE public.scramble_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hole int NOT NULL CHECK (hole BETWEEN 1 AND 18),
  team text NOT NULL,
  strokes int CHECK (strokes BETWEEN 1 AND 20),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (hole, team)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.scramble_scores TO authenticated;
GRANT ALL ON public.scramble_scores TO service_role;
ALTER TABLE public.scramble_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "signed in can read scramble" ON public.scramble_scores FOR SELECT TO authenticated USING (true);
CREATE POLICY "signed in can insert scramble" ON public.scramble_scores FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "signed in can update scramble" ON public.scramble_scores FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "signed in can delete scramble" ON public.scramble_scores FOR DELETE TO authenticated USING (true);

ALTER PUBLICATION supabase_realtime ADD TABLE public.hole_scores;
ALTER PUBLICATION supabase_realtime ADD TABLE public.wolf_calls;
ALTER PUBLICATION supabase_realtime ADD TABLE public.scramble_scores;