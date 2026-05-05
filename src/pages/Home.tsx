import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useListings } from '../hooks/useListings';
import { useAuth } from '../hooks/useAuth';
import { MenuIcon, XIcon, StarIcon } from '../components/Icons';
import './Home.css';

const wilayas = [
  'Alger', 'Oran', 'Constantine', 'Annaba', 'Blida', 'Batna', 'Bejaia', 'Tizi Ouzou',
  'Mostaganem', 'Tlemcen', 'Setif', 'Biskra', 'Bechar', 'Medea', 'Tebessa'
];

function Home() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [search, setSearch] = useState({ wilaya: '', priceRange: 'any' });
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const { listings, loading, error } = useListings({ 
    status: 'active', 
    limit: 8,
    sortBy: 'newest'
  });

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (search.wilaya) params.set('wilaya', search.wilaya);
    if (search.priceRange !== 'any') params.set('price', search.priceRange);
    navigate(`/search?${params.toString()}`);
  };

  return (
    <div className="home">
      <header className={`header ${scrolled ? 'scrolled' : ''}`}>
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
              <a href="/favorites" onClick={(e) => { e.preventDefault(); setMobileMenuOpen(false); navigate('/favorites'); }}>Favorites</a>
              <a href="#" onClick={(e) => { e.preventDefault(); setMobileMenuOpen(false); }}>{profile?.full_name || 'Account'}</a>
            </>
          ) : (
            <a href="/signin" onClick={(e) => { e.preventDefault(); setMobileMenuOpen(false); navigate('/signin'); }}>Sign in</a>
          )}
        </nav>
      </header>

      <div className="hero">
        <div className="hero-overlay"></div>
        <div className="hero-content">
          <h1>Find your perfect rental in Algeria</h1>

          <form className="search-box" onSubmit={handleSearch}>
            <div className="search-field">
              <label>Wilaya</label>
              <select
                value={search.wilaya}
                onChange={(e) => setSearch({...search, wilaya: e.target.value})}
              >
                <option value="">Select wilaya</option>
                {wilayas.map(w => <option key={w} value={w}>{w}</option>)}
              </select>
            </div>

            <div className="search-field">
              <label>Price</label>
              <select
                value={search.priceRange}
                onChange={(e) => setSearch({...search, priceRange: e.target.value})}
              >
                <option value="any">Any price</option>
                <option value="0-30000">0 - 30,000 DA</option>
                <option value="30000-50000">30,000 - 50,000 DA</option>
                <option value="50000-100000">50,000 - 100,000 DA</option>
                <option value="100000+">100,000+ DA</option>
              </select>
            </div>

            <button type="submit" className="search-btn">Search</button>
          </form>
        </div>
      </div>

      <section className="featured">
        <h2>Featured listings</h2>
        
        {loading ? (
          <div className="cards-grid">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="card-skeleton" style={{ height: '300px', background: '#e2e8f0', borderRadius: '16px' }} />
            ))}
          </div>
        ) : error ? (
          <div className="error-message" style={{ textAlign: 'center', padding: '2rem' }}>
            <p>Error loading listings. Please try again later.</p>
          </div>
        ) : (
          <div className="cards-grid">
            {listings.map(listing => {
              const mainImage = listing.listing_images?.sort((a, b) => a.display_order - b.display_order)[0]?.url;
              
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
                    {listing.reviews_avg && listing.reviews_avg > 0 && (
                      <div className="card-rating">
                        <StarIcon size={14} filled />
                        {listing.reviews_avg}
                      </div>
                    )}
                  </div>
                  <div className="card-info">
                    <h3>{listing.title}</h3>
                    <p>{listing.wilaya} • {listing.bedrooms} bed{listing.bedrooms !== 1 ? 's' : ''} • {listing.area}m²</p>
                    <span className="price">{listing.price.toLocaleString()} DA/month</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

export default Home;
