import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useListings } from '../hooks/useListings';
import { 
  MenuIcon, XIcon, HeartIcon, StarIcon, 
  BeachIcon, MonumentIcon, MapPinIcon 
} from '../components/Icons';
import './Search.css';
import './Favorites.css';

function Favorites() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [localFavorites, setLocalFavorites] = useState<Set<string>>(new Set());

  // Load favorites from localStorage
  useEffect(() => {
    const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    setFavoriteIds(favorites);
    setLocalFavorites(new Set(favorites));
  }, []);

  // Fetch all active listings to filter by favorites
  const { listings, loading, error } = useListings({ 
    status: 'active',
    limit: 100 // Get more to cover likely favorites
  });

  // Filter to only favorited listings
  const favoriteListings = useMemo(() => {
    return listings.filter(listing => localFavorites.has(listing.id));
  }, [listings, localFavorites]);

  const removeFavorite = (id: string) => {
    const newFavorites = favoriteIds.filter(fav => fav !== id);
    setFavoriteIds(newFavorites);
    setLocalFavorites(new Set(newFavorites));
    localStorage.setItem('favorites', JSON.stringify(newFavorites));
  };

  // Loading skeleton
  if (loading) {
    return (
      <div className="search-page">
        <header className="header">
          <div className="logo" onClick={() => navigate('/')}>
            <img src="/src/assets/logo.png" alt="Bayti" />
          </div>
        </header>
        <div className="search-content" style={{ paddingTop: '100px' }}>
          <main className="results" style={{ width: '100%', maxWidth: '1400px', margin: '0 auto', padding: '1.5rem' }}>
            <h2>Your Favorites</h2>
            <div className="cards-grid">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="card-skeleton" style={{ height: '300px', background: '#e2e8f0', borderRadius: '16px' }} />
              ))}
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="search-page">
      <header className="header">
        <div className="logo" onClick={() => navigate('/')}>
          <img src="/src/assets/logo.png" alt="Bayti" />
        </div>
        <button className="mobile-menu-btn" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          {mobileMenuOpen ? <XIcon size={24} /> : <MenuIcon size={24} />}
        </button>
        <nav className={`desktop-nav ${mobileMenuOpen ? 'mobile-open' : ''}`}>
          <a href="/search" onClick={(e) => { e.preventDefault(); setMobileMenuOpen(false); navigate('/search'); }}>Browse</a>
          {user ? (
            <>
              <a href="/become-a-host" onClick={(e) => { e.preventDefault(); setMobileMenuOpen(false); navigate('/become-a-host'); }}>Become a host</a>
              <a href="/favorites" onClick={(e) => { e.preventDefault(); setMobileMenuOpen(false); }} className="active">Favorites</a>
              <a href="#" onClick={(e) => { e.preventDefault(); setMobileMenuOpen(false); }}>{profile?.full_name || 'Account'}</a>
            </>
          ) : (
            <a href="/signin" onClick={(e) => { e.preventDefault(); setMobileMenuOpen(false); navigate('/signin'); }}>Sign in</a>
          )}
        </nav>
      </header>

      <div className="search-content" style={{ paddingTop: '100px' }}>
        <main className="results" style={{ width: '100%', maxWidth: '1400px', margin: '0 auto', padding: '1.5rem' }}>
          <h2>Your Favorites ({favoriteListings.length})</h2>

          {error ? (
            <div className="error-state" style={{ textAlign: 'center', padding: '3rem' }}>
              <p>Error loading favorites. Please try again.</p>
              <button className="btn-primary" onClick={() => window.location.reload()}>
                Retry
              </button>
            </div>
          ) : favoriteListings.length === 0 ? (
            <div className="empty-state">
              <HeartIcon size={80} className="empty-icon" />
              <h3>No favorites yet</h3>
              <p>Save properties you love to access them quickly here</p>
              <button className="clear-filters-btn" onClick={() => navigate('/search')}>
                Browse listings
              </button>
            </div>
          ) : (
            <div className="cards-grid">
              {favoriteListings.map(listing => {
                const mainImage = listing.listing_images?.sort((a, b) => a.display_order - b.display_order)[0]?.url;
                const hasBeach = listing.listing_tags.some(t => t.tag === 'nearBeach');
                const hasMonument = listing.listing_tags.some(t => t.tag === 'monument');
                const hasCenter = listing.listing_tags.some(t => t.tag === 'cityCenter');
                const hasFurnished = listing.listing_amenities.some(a => a.amenity === 'furnished');
                const hasPets = listing.listing_amenities.some(a => a.amenity === 'pets');

                return (
                  <div key={listing.id} className="card" onClick={() => navigate(`/listing/${listing.id}`)}>
                    <div 
                      className="card-image" 
                      style={{ 
                        backgroundImage: mainImage ? `url(${mainImage})` : 'linear-gradient(135deg, #0891b2, #06b6d4)',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center'
                      }}
                    >
                      <div className="card-badges">
                        {hasBeach && <span className="badge"><BeachIcon size={12} /> Beach</span>}
                        {hasMonument && <span className="badge"><MonumentIcon size={12} /> Historic</span>}
                        {hasCenter && <span className="badge"><MapPinIcon size={12} /> Center</span>}
                      </div>
                      {listing.reviews_avg && listing.reviews_avg > 0 && (
                        <div className="card-rating">
                          <StarIcon size={14} filled />
                          {listing.reviews_avg}
                        </div>
                      )}
                      <button 
                        className="favorite-remove-btn"
                        onClick={(e) => { e.stopPropagation(); removeFavorite(listing.id); }}
                      >
                        <HeartIcon size={20} filled className="heart-filled" />
                      </button>
                    </div>
                    <div className="card-info">
                      <h3>{listing.title}</h3>
                      <p>{listing.wilaya} • {listing.bedrooms} bed{listing.bedrooms !== 1 ? 's' : ''} • {listing.area}m²</p>
                      <div className="card-tags">
                        {hasFurnished && <span className="tag">Furnished</span>}
                        {hasPets && <span className="tag">Pets OK</span>}
                      </div>
                      <span className="price">{listing.price.toLocaleString()} DA/month</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default Favorites;
