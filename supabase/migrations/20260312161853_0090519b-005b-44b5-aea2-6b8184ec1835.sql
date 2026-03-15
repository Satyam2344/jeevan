
CREATE POLICY "Users can update own wallet" ON public.wallets
  FOR UPDATE USING (auth.uid() = user_id);

-- Allow insert on color_trading_rounds for authenticated users (game creates rounds)
CREATE POLICY "Auth users can create color rounds" ON public.color_trading_rounds
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Auth users can update color rounds" ON public.color_trading_rounds
  FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Same for ball pool
CREATE POLICY "Auth users can create ball pool rounds" ON public.ball_pool_rounds
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Auth users can update ball pool rounds" ON public.ball_pool_rounds
  FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Allow updating bets
CREATE POLICY "Users can update own color bets" ON public.color_trading_bets
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can update own ball bets" ON public.ball_pool_bets
  FOR UPDATE USING (auth.uid() = user_id);

-- Allow updating rummy tables for players
CREATE POLICY "Auth users can update rummy tables" ON public.rummy_tables
  FOR UPDATE USING (auth.uid() IS NOT NULL);
