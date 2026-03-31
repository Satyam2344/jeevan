CREATE TABLE public.fantasy_players (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid REFERENCES public.cricket_matches(id) ON DELETE CASCADE NOT NULL,
  player_name text NOT NULL,
  team text NOT NULL,
  role text NOT NULL DEFAULT 'batsman',
  credits numeric NOT NULL DEFAULT 8.0,
  points numeric NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.fantasy_contests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid REFERENCES public.cricket_matches(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  entry_fee bigint NOT NULL DEFAULT 50,
  prize_pool bigint NOT NULL DEFAULT 0,
  max_participants integer NOT NULL DEFAULT 100,
  current_participants integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'upcoming',
  prize_distribution jsonb DEFAULT '[{"rank":1,"percent":40},{"rank":2,"percent":25},{"rank":3,"percent":15},{"rank":4,"percent":8},{"rank":5,"percent":5},{"rank":6,"percent":3},{"rank":7,"percent":2},{"rank":8,"percent":1},{"rank":9,"percent":0.5},{"rank":10,"percent":0.5}]'::jsonb,
  created_by text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.fantasy_teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contest_id uuid REFERENCES public.fantasy_contests(id) ON DELETE CASCADE NOT NULL,
  user_id uuid NOT NULL,
  team_name text NOT NULL DEFAULT 'My Team',
  players jsonb NOT NULL DEFAULT '[]'::jsonb,
  captain text,
  vice_captain text,
  total_points numeric NOT NULL DEFAULT 0,
  rank integer,
  payout bigint DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.fantasy_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fantasy_contests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fantasy_teams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view fantasy players" ON public.fantasy_players FOR SELECT USING (true);
CREATE POLICY "Admins can manage fantasy players" ON public.fantasy_players FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can view fantasy contests" ON public.fantasy_contests FOR SELECT USING (true);
CREATE POLICY "Admins can manage fantasy contests" ON public.fantasy_contests FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view own fantasy teams" ON public.fantasy_teams FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create fantasy teams" ON public.fantasy_teams FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can manage fantasy teams" ON public.fantasy_teams FOR ALL USING (has_role(auth.uid(), 'admin'));