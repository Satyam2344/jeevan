
-- Timestamp update function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- ========== USER ROLES ==========
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "Users can view own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles" ON public.user_roles
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage roles" ON public.user_roles
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- ========== WALLETS (created before profiles so trigger can reference it) ==========
CREATE TABLE public.wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  balance BIGINT DEFAULT 0,
  bonus_balance BIGINT DEFAULT 0,
  total_deposited BIGINT DEFAULT 0,
  total_withdrawn BIGINT DEFAULT 0,
  total_winnings BIGINT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own wallet" ON public.wallets
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all wallets" ON public.wallets
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage wallets" ON public.wallets
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_wallets_updated_at
  BEFORE UPDATE ON public.wallets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ========== PROFILES ==========
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  username TEXT UNIQUE,
  display_name TEXT,
  email TEXT,
  phone TEXT,
  avatar_url TEXT,
  date_of_birth DATE,
  kyc_status TEXT DEFAULT 'pending' CHECK (kyc_status IN ('pending', 'submitted', 'verified', 'rejected')),
  referral_code TEXT UNIQUE DEFAULT substring(md5(random()::text), 1, 8),
  referred_by UUID REFERENCES public.profiles(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable" ON public.profiles
  FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can manage all profiles" ON public.profiles
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile, role, wallet on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, username)
  VALUES (NEW.id, NEW.email, split_part(NEW.email, '@', 1));
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  INSERT INTO public.wallets (user_id)
  VALUES (NEW.id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ========== TRANSACTIONS ==========
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('deposit', 'withdrawal', 'game_entry', 'game_win', 'bonus', 'referral_bonus')),
  amount BIGINT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  payment_method TEXT,
  razorpay_order_id TEXT,
  razorpay_payment_id TEXT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own transactions" ON public.transactions
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create transactions" ON public.transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all transactions" ON public.transactions
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage transactions" ON public.transactions
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- ========== GAME CONFIGURATIONS ==========
CREATE TABLE public.game_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_type TEXT NOT NULL UNIQUE CHECK (game_type IN ('rummy', 'color_trading', 'ball_pool', 'motm', 'ipl_prediction')),
  title TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  min_bet BIGINT DEFAULT 10,
  max_bet BIGINT DEFAULT 10000,
  commission_percent NUMERIC(5,2) DEFAULT 5.00,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.game_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view games" ON public.game_configs
  FOR SELECT USING (true);
CREATE POLICY "Admins can manage games" ON public.game_configs
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_game_configs_updated_at
  BEFORE UPDATE ON public.game_configs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ========== COLOR TRADING ==========
CREATE TABLE public.color_trading_rounds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  round_number SERIAL,
  result_color TEXT CHECK (result_color IN ('red', 'green', 'blue')),
  status TEXT DEFAULT 'betting' CHECK (status IN ('betting', 'locked', 'completed')),
  starts_at TIMESTAMPTZ DEFAULT now(),
  ends_at TIMESTAMPTZ DEFAULT now() + interval '60 seconds',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.color_trading_rounds ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view color rounds" ON public.color_trading_rounds FOR SELECT USING (true);
CREATE POLICY "Admins can manage color rounds" ON public.color_trading_rounds FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.color_trading_bets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  round_id UUID REFERENCES public.color_trading_rounds(id) ON DELETE CASCADE NOT NULL,
  predicted_color TEXT NOT NULL CHECK (predicted_color IN ('red', 'green', 'blue')),
  amount BIGINT NOT NULL,
  payout BIGINT DEFAULT 0,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'won', 'lost')),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.color_trading_bets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own color bets" ON public.color_trading_bets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can place color bets" ON public.color_trading_bets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all color bets" ON public.color_trading_bets FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- ========== BALL POOL ==========
CREATE TABLE public.ball_pool_rounds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  round_number SERIAL,
  winning_ball INT CHECK (winning_ball BETWEEN 1 AND 10),
  multiplier NUMERIC(4,2) DEFAULT 1.0,
  status TEXT DEFAULT 'betting' CHECK (status IN ('betting', 'locked', 'completed')),
  starts_at TIMESTAMPTZ DEFAULT now(),
  ends_at TIMESTAMPTZ DEFAULT now() + interval '45 seconds',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.ball_pool_rounds ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view ball pool rounds" ON public.ball_pool_rounds FOR SELECT USING (true);
CREATE POLICY "Admins can manage ball pool rounds" ON public.ball_pool_rounds FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.ball_pool_bets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  round_id UUID REFERENCES public.ball_pool_rounds(id) ON DELETE CASCADE NOT NULL,
  selected_ball INT NOT NULL CHECK (selected_ball BETWEEN 1 AND 10),
  amount BIGINT NOT NULL,
  payout BIGINT DEFAULT 0,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'won', 'lost')),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.ball_pool_bets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own ball bets" ON public.ball_pool_bets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can place ball bets" ON public.ball_pool_bets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all ball bets" ON public.ball_pool_bets FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- ========== RUMMY ==========
CREATE TABLE public.rummy_tables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  entry_fee BIGINT NOT NULL,
  max_players INT DEFAULT 6 CHECK (max_players BETWEEN 2 AND 6),
  current_players INT DEFAULT 0,
  status TEXT DEFAULT 'waiting' CHECK (status IN ('waiting', 'playing', 'completed')),
  is_private BOOLEAN DEFAULT false,
  table_code TEXT UNIQUE DEFAULT substring(md5(random()::text), 1, 6),
  winner_id UUID REFERENCES auth.users(id),
  prize_pool BIGINT DEFAULT 0,
  game_data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.rummy_tables ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view rummy tables" ON public.rummy_tables FOR SELECT USING (true);
CREATE POLICY "Auth users can create tables" ON public.rummy_tables FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Admins can manage rummy tables" ON public.rummy_tables FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_rummy_tables_updated_at
  BEFORE UPDATE ON public.rummy_tables FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.rummy_players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_id UUID REFERENCES public.rummy_tables(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  hand JSONB DEFAULT '[]',
  score INT DEFAULT 0,
  status TEXT DEFAULT 'playing' CHECK (status IN ('playing', 'folded', 'won', 'lost')),
  joined_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(table_id, user_id)
);

ALTER TABLE public.rummy_players ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own rummy data" ON public.rummy_players FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can join tables" ON public.rummy_players FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can manage rummy players" ON public.rummy_players FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- ========== CRICKET MATCHES ==========
CREATE TABLE public.cricket_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_a TEXT NOT NULL,
  team_b TEXT NOT NULL,
  match_date TIMESTAMPTZ NOT NULL,
  venue TEXT,
  match_type TEXT DEFAULT 'ipl' CHECK (match_type IN ('ipl', 'international', 'domestic')),
  status TEXT DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'live', 'completed')),
  winner_team TEXT,
  man_of_match TEXT,
  players_team_a JSONB DEFAULT '[]',
  players_team_b JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.cricket_matches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view matches" ON public.cricket_matches FOR SELECT USING (true);
CREATE POLICY "Admins can manage matches" ON public.cricket_matches FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_cricket_matches_updated_at
  BEFORE UPDATE ON public.cricket_matches FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ========== MATCH PREDICTIONS ==========
CREATE TABLE public.match_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  match_id UUID REFERENCES public.cricket_matches(id) ON DELETE CASCADE NOT NULL,
  prediction_type TEXT NOT NULL CHECK (prediction_type IN ('motm', 'winner', 'top_batsman', 'top_bowler')),
  prediction_value TEXT NOT NULL,
  amount BIGINT NOT NULL,
  payout BIGINT DEFAULT 0,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'won', 'lost')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, match_id, prediction_type)
);

ALTER TABLE public.match_predictions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own predictions" ON public.match_predictions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can make predictions" ON public.match_predictions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all predictions" ON public.match_predictions FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage predictions" ON public.match_predictions FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- ========== IPL PREDICTIONS ==========
CREATE TABLE public.ipl_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  season TEXT NOT NULL DEFAULT '2026',
  prediction_type TEXT NOT NULL CHECK (prediction_type IN ('winner', 'top_batsman', 'top_bowler', 'final_prediction')),
  prediction_value TEXT NOT NULL,
  amount BIGINT NOT NULL,
  payout BIGINT DEFAULT 0,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'won', 'lost')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, season, prediction_type)
);

ALTER TABLE public.ipl_predictions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own IPL predictions" ON public.ipl_predictions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can make IPL predictions" ON public.ipl_predictions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all IPL predictions" ON public.ipl_predictions FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage IPL predictions" ON public.ipl_predictions FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- ========== FRAUD ALERTS ==========
CREATE TABLE public.fraud_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  alert_type TEXT NOT NULL,
  severity TEXT DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  details TEXT,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'resolved', 'dismissed')),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.fraud_alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage fraud alerts" ON public.fraud_alerts FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- ========== SEED GAME CONFIGS ==========
INSERT INTO public.game_configs (game_type, title, description, is_active, min_bet, max_bet, commission_percent) VALUES
  ('rummy', 'Rummy Card Game', 'Classic multiplayer card game with tournaments and private tables', true, 50, 10000, 5.00),
  ('color_trading', 'Color Trading', 'Predict the next color and win instant rewards', true, 10, 5000, 3.00),
  ('ball_pool', 'Ball Pool Guess', 'Pick a numbered ball and win based on multiplier', true, 10, 5000, 4.00),
  ('motm', 'Man of the Match', 'Predict the star player before the match', true, 50, 10000, 2.00),
  ('ipl_prediction', 'IPL Winner Prediction', 'Season-long contest for IPL predictions', true, 100, 50000, 3.00);
