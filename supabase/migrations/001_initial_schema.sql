-- Enable Row Level Security
ALTER DATABASE postgres SET "app.settings.jwt_secret" TO 'your-jwt-secret';

-- Create enum types
CREATE TYPE user_role AS ENUM ('renter', 'host', 'admin');
CREATE TYPE listing_status AS ENUM ('pending', 'active', 'expired', 'rejected');
CREATE TYPE report_reason AS ENUM ('Scam', 'Fake listing', 'Wrong information', 'Inappropriate content');

-- Profiles table
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  phone TEXT UNIQUE,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  role user_role DEFAULT 'renter',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Listings table
CREATE TABLE listings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  host_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('apartment', 'villa', 'studio', 'house')),
  wilaya TEXT NOT NULL,
  price INTEGER NOT NULL CHECK (price > 0),
  area INTEGER NOT NULL CHECK (area > 0),
  bedrooms INTEGER NOT NULL CHECK (bedrooms >= 0),
  bathrooms INTEGER NOT NULL CHECK (bathrooms >= 0),
  description TEXT,
  status listing_status DEFAULT 'pending',
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  views INTEGER DEFAULT 0,
  contact_clicks INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '30 days')
);

-- Listing images table
CREATE TABLE listing_images (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id UUID REFERENCES listings(id) ON DELETE CASCADE NOT NULL,
  url TEXT NOT NULL,
  display_order INTEGER DEFAULT 0
);

-- Listing amenities table
CREATE TABLE listing_amenities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id UUID REFERENCES listings(id) ON DELETE CASCADE NOT NULL,
  amenity TEXT NOT NULL
);

-- Listing tags table
CREATE TABLE listing_tags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id UUID REFERENCES listings(id) ON DELETE CASCADE NOT NULL,
  tag TEXT NOT NULL
);

-- Reviews table
CREATE TABLE reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id UUID REFERENCES listings(id) ON DELETE CASCADE NOT NULL,
  author_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  stars INTEGER NOT NULL CHECK (stars >= 1 AND stars <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(listing_id, author_id)
);

-- Reports table
CREATE TABLE reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id UUID REFERENCES listings(id) ON DELETE CASCADE NOT NULL,
  reporter_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  reason report_reason NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE listing_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE listing_amenities ENABLE ROW LEVEL SECURITY;
ALTER TABLE listing_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Profiles RLS policies
CREATE POLICY "Anyone can read profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Listings RLS policies
CREATE POLICY "Anyone can read active listings" ON listings FOR SELECT USING (status = 'active');
CREATE POLICY "Hosts can read own listings" ON listings FOR SELECT USING (auth.uid() = host_id);
CREATE POLICY "Hosts can insert listings" ON listings FOR INSERT WITH CHECK (auth.uid() = host_id);
CREATE POLICY "Hosts can update own listings" ON listings FOR UPDATE USING (auth.uid() = host_id);
CREATE POLICY "Hosts can delete own listings" ON listings FOR DELETE USING (auth.uid() = host_id);

-- Admin can do everything
CREATE POLICY "Admins can manage all listings" ON listings FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Listing images policies
CREATE POLICY "Anyone can read listing images" ON listing_images FOR SELECT USING (true);
CREATE POLICY "Hosts can manage listing images" ON listing_images FOR ALL USING (
  EXISTS (
    SELECT 1 FROM listings WHERE id = listing_images.listing_id AND host_id = auth.uid()
  )
);

-- Listing amenities policies
CREATE POLICY "Anyone can read listing amenities" ON listing_amenities FOR SELECT USING (true);
CREATE POLICY "Hosts can manage listing amenities" ON listing_amenities FOR ALL USING (
  EXISTS (
    SELECT 1 FROM listings WHERE id = listing_amenities.listing_id AND host_id = auth.uid()
  )
);

-- Listing tags policies
CREATE POLICY "Anyone can read listing tags" ON listing_tags FOR SELECT USING (true);
CREATE POLICY "Hosts can manage listing tags" ON listing_tags FOR ALL USING (
  EXISTS (
    SELECT 1 FROM listings WHERE id = listing_tags.listing_id AND host_id = auth.uid()
  )
);

-- Reviews policies
CREATE POLICY "Anyone can read reviews" ON reviews FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert reviews" ON reviews FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Users can update own reviews" ON reviews FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY "Users can delete own reviews" ON reviews FOR DELETE USING (auth.uid() = author_id);

-- Reports policies
CREATE POLICY "Admins can read all reports" ON reports FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  )
);
CREATE POLICY "Authenticated users can submit reports" ON reports FOR INSERT WITH CHECK (auth.uid() = reporter_id);

-- Create storage bucket for listing images
INSERT INTO storage.buckets (id, name, public) VALUES ('listings', 'listings', true);

-- Storage policies
CREATE POLICY "Anyone can view listing images" ON storage.objects FOR SELECT USING (bucket_id = 'listings');
CREATE POLICY "Authenticated users can upload listing images" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'listings' AND auth.role() = 'authenticated'
);
CREATE POLICY "Users can delete own listing images" ON storage.objects FOR DELETE USING (
  bucket_id = 'listings' AND auth.uid() = owner
);

-- Indexes for performance
CREATE INDEX idx_listings_status ON listings(status);
CREATE INDEX idx_listings_wilaya ON listings(wilaya);
CREATE INDEX idx_listings_price ON listings(price);
CREATE INDEX idx_listings_host_id ON listings(host_id);
CREATE INDEX idx_reviews_listing_id ON reviews(listing_id);
CREATE INDEX idx_listing_images_listing_id ON listing_images(listing_id);
CREATE INDEX idx_reports_listing_id ON reports(listing_id);

-- Function to auto-create profile after signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'full_name',
    'renter'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user signup
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
