import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useListings } from '../hooks/useListings';
import { useAuth } from '../hooks/useAuth';
import { 
  BeachIcon, MonumentIcon, CityIcon, MetroIcon, AirportIcon, 
  CouchIcon, PetIcon, SortIcon, EmptyStateIcon, ClearFiltersIcon, 
  MenuIcon, XIcon, MapPinIcon 
} from '../components/Icons';
import './Search.css';

const wilayas = [
  'Alger', 'Oran', 'Constantine', 'Annaba', 'Blida', 'Batna', 'Bejaia', 'Tizi Ouzou',
  'Mostaganem', 'Tlemcen', 'Setif', 'Biskra', 'Bechar', 'Medea', 'Tebessa', 'Tiaret',
  'Tindouf', 'Illizi', 'Bordj Bou Arreridj', 'Boumerdes', 'El Tarf', 'Tissemsilt',
  'Ouargla', 'Relizane', 'Souk Ahras', 'Tipaza', 'Mila', 'Defla', 'Ghardaia',
  'Ain Temouchent', 'Naama', 'Ain Defla', 'Djelfa', 'El Oued', 'Khenchela',
  'Laghouat', 'Mascara', 'Msila', 'Saida', 'Sidi Bel Abbes', 'Skikda', 'Tamanghasset',
  'El Bayadh', 'Oum El Bouaghi', 'Tebessa', 'Jijel', 'Bouira', 'Guelma', 'Adrar',
  'Chlef', 'Tlemcen', 'Tamanrasset', 'El Meghaier', 'El Menia', 'Ouled Djellal',
  'Beni Abbes', 'Timimoun', 'Touggourt', 'Djanet', 'In Salah', 'In Guezzam'
].sort();

function Search() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Filter state
  const [filters, setFilters] = useState({
    wilaya: '',
    priceMin: '',
    priceMax: '',
    bedrooms: 'any',
    propertyType: 'any',
    nearBeach: false,
    nearMonument: false,
    cityCenter: false,
    metro: false,
    airport: false,
    furnished: false,
    pets: false
  });

  const [sortBy, setSortBy] = useState<'newest' | 'price-asc' | 'price-desc' | 'rating'>('newest');

  // Build options for useListings hook
  const listingOptions = useMemo(() => ({
    status: 'active' as const,
    wilaya: filters.wilaya || undefined,
    priceMin: filters.priceMin ? parseInt(filters.priceMin) : undefined,
    priceMax: filters.priceMax ? parseInt(filters.priceMax) : undefined,
    bedrooms: filters.bedrooms !== 'any' ? parseInt(filters.bedrooms) : undefined,
    propertyType: filters.propertyType !== 'any' ? filters.propertyType : undefined,
    sortBy,
  }), [filters, sortBy]);

  const { listings, loading, error, refetch } = useListings(listingOptions);

  // Client-side filtering for boolean fields
  const filteredListings = useMemo(() => {
    return listings.filter(listing => {
      if (filters.nearBeach && !listing.listing_tags.some(t => t.tag === 'nearBeach')) return false;
      if (filters.nearMonument && !listing.listing_tags.some(t => t.tag === 'monument')) return false;
      if (filters.cityCenter && !listing.listing_tags.some(t => t.tag === 'cityCenter')) return false;
      if (filters.metro && !listing.listing_tags.some(t => t.tag === 'metro')) return false;
      if (filters.airport && !listing.listing_tags.some(t => t.tag === 'airport')) return false;
      if (filters.furnished && !listing.listing_amenities.some(a => a.amenity === 'furnished')) return false;
      if (filters.pets && !listing.listing_amenities.some(a => a.amenity === 'pets')) return false;
      return true;
    });
  }, [listings, filters]);

  const clearFilters = () => {
    setFilters({
      wilaya: '',
      priceMin: '',
      priceMax: '',
      bedrooms: 'any',
      propertyType: 'any',
      nearBeach: false,
      nearMonument: false,
      cityCenter: false,
      metro: false,
      airport: false,
      furnished: false,
      pets: false
    });
  };

  const hasActiveFilters = Object.values(filters).some(v => v !== '' && v !== false && v !== 'any');

  // Loading skeleton
  if (loading) {
    return (
      <div className="search-page">
        <header className="header">
          <div className="logo" onClick={() => navigate('/')}>
            <img src="/src/assets/logo.png" alt="Bayti" />
          </div>
          <div className="header-skeleton" style={{ width: '200px', height: '40px', background: '#e2e8f0', borderRadius: '8px' }} />
        </header>
        <div className="search-content" style={{ paddingTop: '100px' }}>
          <div className="filters-skeleton" style={{ width: '280px' }}>
            {[...Array(6)].map((_, i) => (
              <div key={i} style={{ height: '60px', background: '#e2e8f0', borderRadius: '8px', marginBottom: '1rem' }} />
            ))}
          </div>
          <div className="results-skeleton" style={{ flex: 1 }}>
            <div style={{ height: '40px', background: '#e2e8f0', borderRadius: '8px', marginBottom: '1.5rem' }} />
            <div className="cards-grid">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="card-skeleton" style={{ height: '300px', background: '#e2e8f0', borderRadius: '16px' }} />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="search-page">
        <header className="header">
          <div className="logo" onClick={() => navigate('/')}>
            <img src="/src/assets/logo.png" alt="Bayti" />
          </div>
          <nav className="desktop-nav">
            {user ? (
              <>
                <a href="/become-a-host" onClick={(e) => { e.preventDefault(); navigate('/become-a-host'); }}>Become a host</a>
                <a href="/favorites" onClick={(e) => { e.preventDefault(); navigate('/favorites'); }}>Favorites</a>
                <a href="#" onClick={(e) => { e.preventDefault(); }}>{profile?.full_name || 'Account'}</a>
              </>
            ) : (
              <a href="/signin" onClick={(e) => { e.preventDefault(); navigate('/signin'); }}>Sign in</a>
            )}
          </nav>
        </header>
        <div className="error-container" style={{ paddingTop: '120px', textAlign: 'center' }}>
          <h2>Error loading listings</h2>
          <p>{error}</p>
          <button className="btn-primary" onClick={refetch} style={{ marginTop: '1rem' }}>
            Try Again
          </button>
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
          <a href="/search" onClick={(e) => { e.preventDefault(); setMobileMenuOpen(false); }}>Browse</a>
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

      <div className="search-content">
        <aside className="filters">
          <div className="filters-header">
            <h3>Filters</h3>
            {hasActiveFilters && (
              <button className="clear-btn" onClick={clearFilters}>
                Clear
              </button>
            )}
          </div>

          <div className="filter-group">
            <label>Wilaya</label>
            <select
              value={filters.wilaya}
              onChange={(e) => setFilters({...filters, wilaya: e.target.value})}
            >
              <option value="">All wilayas</option>
              {wilayas.map(w => (
                <option key={w} value={w}>{w}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Price Range (DA/month)</label>
            <div className="price-range">
              <input
                type="number"
                placeholder="Min"
                value={filters.priceMin}
                onChange={(e) => setFilters({...filters, priceMin: e.target.value})}
              />
              <span>to</span>
              <input
                type="number"
                placeholder="Max"
                value={filters.priceMax}
                onChange={(e) => setFilters({...filters, priceMax: e.target.value})}
              />
            </div>
          </div>

          <div className="filter-group">
            <label>Bedrooms</label>
            <select
              value={filters.bedrooms}
              onChange={(e) => setFilters({...filters, bedrooms: e.target.value})}
            >
              <option value="any">Any</option>
              <option value="1">1+</option>
              <option value="2">2+</option>
              <option value="3">3+</option>
              <option value="4">4+</option>
              <option value="5">5+</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Property Type</label>
            <select
              value={filters.propertyType}
              onChange={(e) => setFilters({...filters, propertyType: e.target.value})}
            >
              <option value="any">Any type</option>
              <option value="apartment">Apartment</option>
              <option value="villa">Villa</option>
              <option value="house">House</option>
              <option value="studio">Studio</option>
            </select>
          </div>

          <div className="filter-divider">Location & Nearby</div>

          <div className="filter-checkbox">
            <input
              type="checkbox"
              id="nearBeach"
              checked={filters.nearBeach}
              onChange={(e) => setFilters({...filters, nearBeach: e.target.checked})}
            />
            <label htmlFor="nearBeach"><BeachIcon size={16} /> Near Beach</label>
          </div>

          <div className="filter-checkbox">
            <input
              type="checkbox"
              id="nearMonument"
              checked={filters.nearMonument}
              onChange={(e) => setFilters({...filters, nearMonument: e.target.checked})}
            />
            <label htmlFor="nearMonument"><MonumentIcon size={16} /> Near Monument</label>
          </div>

          <div className="filter-checkbox">
            <input
              type="checkbox"
              id="cityCenter"
              checked={filters.cityCenter}
              onChange={(e) => setFilters({...filters, cityCenter: e.target.checked})}
            />
            <label htmlFor="cityCenter"><CityIcon size={16} /> City Center</label>
          </div>

          <div className="filter-checkbox">
            <input
              type="checkbox"
              id="metro"
              checked={filters.metro}
              onChange={(e) => setFilters({...filters, metro: e.target.checked})}
            />
            <label htmlFor="metro"><MetroIcon size={16} /> Near Metro</label>
          </div>

          <div className="filter-checkbox">
            <input
              type="checkbox"
              id="airport"
              checked={filters.airport}
              onChange={(e) => setFilters({...filters, airport: e.target.checked})}
            />
            <label htmlFor="airport"><AirportIcon size={16} /> Near Airport</label>
          </div>

          <div className="filter-divider">Amenities</div>

          <div className="filter-checkbox">
            <input
              type="checkbox"
              id="furnished"
              checked={filters.furnished}
              onChange={(e) => setFilters({...filters, furnished: e.target.checked})}
            />
            <label htmlFor="furnished"><CouchIcon size={16} /> Furnished</label>
          </div>

          <div className="filter-checkbox">
            <input
              type="checkbox"
              id="pets"
              checked={filters.pets}
              onChange={(e) => setFilters({...filters, pets: e.target.checked})}
            />
            <label htmlFor="pets"><PetIcon size={16} /> Pet Friendly</label>
          </div>
        </aside>

        <main className="results">
          <div className="results-header">
            <h2>{filteredListings.length} {filteredListings.length === 1 ? 'property' : 'properties'} found</h2>
            <div className="sort-dropdown">
              <SortIcon size={16} />
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value as typeof sortBy)}>
                <option value="newest">Newest First</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="rating">Highest Rated</option>
              </select>
            </div>
          </div>

          {filteredListings.length === 0 ? (
            <div className="empty-state">
              <EmptyStateIcon size={80} />
              <h3>No properties found</h3>
              <p>Try adjusting your filters to see more results</p>
              <button className="clear-filters-btn" onClick={clearFilters}>
                <ClearFiltersIcon size={16} />
                Clear all filters
              </button>
            </div>
          ) : (
            <div className="cards-grid">
              {filteredListings.map(listing => {
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
                        background: mainImage ? `url(${mainImage})` : 'linear-gradient(135deg, #0891b2, #06b6d4)',
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
                          ★ {listing.reviews_avg}
                        </div>
                      )}
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

export default Search;
