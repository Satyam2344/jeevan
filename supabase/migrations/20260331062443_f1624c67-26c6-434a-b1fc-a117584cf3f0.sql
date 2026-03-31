
-- Update game_type check constraint to include fantasy
ALTER TABLE public.game_configs DROP CONSTRAINT game_configs_game_type_check;
ALTER TABLE public.game_configs ADD CONSTRAINT game_configs_game_type_check 
  CHECK (game_type = ANY (ARRAY['rummy'::text, 'color_trading'::text, 'ball_pool'::text, 'motm'::text, 'ipl_prediction'::text, 'fantasy'::text]));

-- Add fantasy game config
INSERT INTO public.game_configs (game_type, title, description, min_bet, max_bet, is_active)
VALUES ('fantasy', 'Fantasy Cricket', 'Build your dream team of 11 players and compete for big prizes! Pick captain & vice-captain wisely.', 50, 10000, true);
