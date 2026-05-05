-- Functions for incrementing counters

CREATE OR REPLACE FUNCTION increment_listing_views(listing_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE listings
  SET views = views + 1
  WHERE id = listing_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION increment_listing_contact_clicks(listing_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE listings
  SET contact_clicks = contact_clicks + 1
  WHERE id = listing_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION increment_listing_views(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION increment_listing_views(UUID) TO anon;
GRANT EXECUTE ON FUNCTION increment_listing_contact_clicks(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION increment_listing_contact_clicks(UUID) TO anon;
