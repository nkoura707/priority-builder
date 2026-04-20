-- Updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- profiles
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text,
  onboarding_complete boolean NOT NULL DEFAULT false,
  stripe_customer_id text,
  subscription_status text,
  subscription_id text,
  trial_ends_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Auto-create profile on new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name'
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- locations
CREATE TABLE public.locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  google_account_id text NOT NULL,
  google_location_id text NOT NULL,
  business_name text NOT NULL,
  address text,
  google_access_token text NOT NULL,
  google_refresh_token text NOT NULL,
  token_expires_at timestamptz NOT NULL,
  reply_tone text NOT NULL DEFAULT 'professional'
    CHECK (reply_tone IN ('professional', 'friendly', 'formal')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own locations"
  ON public.locations FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.locations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- reviews
CREATE TABLE public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id uuid NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
  google_review_id text NOT NULL UNIQUE,
  reviewer_name text,
  star_rating int NOT NULL CHECK (star_rating BETWEEN 1 AND 5),
  review_text text,
  review_date timestamptz NOT NULL,
  ai_generated_reply text,
  reply_text text,
  reply_status text NOT NULL DEFAULT 'pending'
    CHECK (reply_status IN ('pending', 'published', 'skipped')),
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage reviews for own locations"
  ON public.reviews FOR ALL
  USING (
    location_id IN (SELECT id FROM public.locations WHERE user_id = auth.uid())
  )
  WITH CHECK (
    location_id IN (SELECT id FROM public.locations WHERE user_id = auth.uid())
  );

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE INDEX idx_locations_user_id ON public.locations(user_id);
CREATE INDEX idx_reviews_location_id ON public.reviews(location_id);
CREATE INDEX idx_reviews_status ON public.reviews(reply_status);