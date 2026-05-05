import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import type { Database } from '../lib/database.types';

type Listing = Database['public']['Tables']['listings']['Row'] & {
  listing_images: { url: string; display_order: number }[];
  listing_amenities: { amenity: string }[];
  listing_tags: { tag: string }[];
  host: { full_name: string; phone: string };
  reviews_avg?: number;
  reviews_count?: number;
};

interface UseListingsOptions {
  wilaya?: string;
  priceMin?: number;
  priceMax?: number;
  bedrooms?: number;
  propertyType?: string;
  status?: 'pending' | 'active' | 'expired' | 'rejected';
  sortBy?: 'newest' | 'price-asc' | 'price-desc' | 'rating';
  limit?: number;
  offset?: number;
}

export function useListings(options: UseListingsOptions = {}) {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [count, setCount] = useState(0);

  const fetchListings = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('listings')
        .select(`
          *,
          listing_images(url, display_order),
          listing_amenities(amenity),
          listing_tags(tag),
          host:profiles(full_name, phone),
          reviews(stars)
        `, { count: 'exact' });

      // Apply filters
      if (options.status) {
        query = query.eq('status', options.status);
      } else {
        query = query.eq('status', 'active');
      }

      if (options.wilaya) {
        query = query.eq('wilaya', options.wilaya);
      }

      if (options.priceMin !== undefined) {
        query = query.gte('price', options.priceMin);
      }

      if (options.priceMax !== undefined) {
        query = query.lte('price', options.priceMax);
      }

      if (options.bedrooms !== undefined && options.bedrooms > 0) {
        query = query.gte('bedrooms', options.bedrooms);
      }

      if (options.propertyType) {
        query = query.eq('type', options.propertyType);
      }

      // Sorting
      switch (options.sortBy) {
        case 'price-asc':
          query = query.order('price', { ascending: true });
          break;
        case 'price-desc':
          query = query.order('price', { ascending: false });
          break;
        case 'newest':
        default:
          query = query.order('created_at', { ascending: false });
          break;
      }

      // Pagination
      if (options.limit) {
        query = query.limit(options.limit);
      }

      if (options.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
      }

      const { data, error: supabaseError, count: totalCount } = await query;

      if (supabaseError) {
        throw supabaseError;
      }

      // Calculate average rating for each listing
      const listingsWithRatings = (data || []).map((listing: any) => {
        const reviews = listing.reviews || [];
        const reviews_count = reviews.length;
        const reviews_avg = reviews_count > 0
          ? reviews.reduce((sum: number, r: any) => sum + (r.stars || 0), 0) / reviews_count
          : 0;

        return {
          ...listing,
          reviews_count,
          reviews_avg: Math.round(reviews_avg * 10) / 10,
        };
      });

      // Sort by rating if requested
      if (options.sortBy === 'rating') {
        listingsWithRatings.sort((a, b) => (b.reviews_avg || 0) - (a.reviews_avg || 0));
      }

      setListings(listingsWithRatings);
      setCount(totalCount || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch listings');
      setListings([]);
    } finally {
      setLoading(false);
    }
  }, [options]);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  const refetch = useCallback(() => {
    fetchListings();
  }, [fetchListings]);

  return { listings, loading, error, count, refetch };
}

export function useListing(id: string | undefined) {
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }

    const fetchListing = async () => {
      setLoading(true);
      setError(null);

      try {
        const { data, error: supabaseError } = await supabase
          .from('listings')
          .select(`
            *,
            listing_images(url, display_order),
            listing_amenities(amenity),
            listing_tags(tag),
            host:profiles(full_name, phone)
          `)
          .eq('id', id)
          .single();

        if (supabaseError) {
          throw supabaseError;
        }

      setListing(data);

      // Increment views - ignore error if RPC doesn't exist yet
      try {
        await (supabase.rpc as any)('increment_listing_views', { listing_id: id });
      } catch {
        // RPC might not exist, continue silently
      }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch listing');
        setListing(null);
      } finally {
        setLoading(false);
      }
    };

    fetchListing();
  }, [id]);

  const incrementContactClicks = useCallback(async () => {
    if (id) {
      try {
        await (supabase.rpc as any)('increment_listing_contact_clicks', { listing_id: id });
      } catch {
        // RPC might not exist
      }
    }
  }, [id]);

  return { listing, loading, error, incrementContactClicks };
}

export function useReviews(listingId: string | undefined) {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReviews = useCallback(async () => {
    if (!listingId) return;

    setLoading(true);
    try {
      const { data, error: supabaseError } = await supabase
        .from('reviews')
        .select(`
          *,
          author:profiles(full_name)
        `)
        .eq('listing_id', listingId)
        .order('created_at', { ascending: false });

      if (supabaseError) throw supabaseError;
      setReviews(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch reviews');
    } finally {
      setLoading(false);
    }
  }, [listingId]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const submitReview = useCallback(async (stars: number, comment: string, authorId: string) => {
    const { error } = await supabase
      .from('reviews')
      .insert({
        listing_id: listingId,
        author_id: authorId,
        stars,
        comment,
      } as any);

    if (!error) {
      await fetchReviews();
    }

    return { error };
  }, [listingId, fetchReviews]);

  return { reviews, loading, error, submitReview, refetch: fetchReviews };
}
