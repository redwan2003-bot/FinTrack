-- Enable RLS on all tables
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_accounts ENABLE ROW LEVEL SECURITY;

-- Transactions Policies
CREATE POLICY "Users can only see their own transactions" 
ON transactions FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can only insert their own transactions" 
ON transactions FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can only update their own transactions" 
ON transactions FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can only delete their own transactions" 
ON transactions FOR DELETE 
USING (auth.uid() = user_id);

-- Budgets Policies
CREATE POLICY "Users can only see their own budgets" 
ON budgets FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can only insert their own budgets" 
ON budgets FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can only update their own budgets" 
ON budgets FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can only delete their own budgets" 
ON budgets FOR DELETE 
USING (auth.uid() = user_id);

-- Portfolio Accounts Policies
CREATE POLICY "Users can only see their own portfolio accounts" 
ON portfolio_accounts FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can only insert their own portfolio accounts" 
ON portfolio_accounts FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can only update their own portfolio accounts" 
ON portfolio_accounts FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can only delete their own portfolio accounts" 
ON portfolio_accounts FOR DELETE 
USING (auth.uid() = user_id);

-- 4. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_budgets_user_id ON budgets(user_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_accounts_user_id ON portfolio_accounts(user_id);
