import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useListing, useReviews } from '../hooks/useListings';
import { useAuth } from '../hooks/useAuth';
import { 
  BedIcon, ShowerIcon, AreaIcon, HeartIcon, MenuIcon, XIcon,
  StarIcon, UserIcon, MapPinIcon, PhoneIcon
} from '../components/Icons';
import './Listing.css';

function Listing() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [reviewFormOpen, setReviewFormOpen] = useState(false);
  const [reviewStars, setReviewStars] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  const { listing, loading, error, incrementContactClicks } = useListing(id);
  const { reviews, loading: reviewsLoading, submitReview, refetch: refetchReviews } = useReviews(id);

  // Check if in favorites
  useEffect(() => {
    if (id) {
      const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
      setIsFavorite(favorites.includes(id));
    }
  }, [id]);

  // Keyboard navigation for lightbox
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!lightboxOpen) return;
      if (e.key === 'Escape') setLightboxOpen(false);
      if (e.key === 'ArrowRight') nextImage();
      if (e.key === 'ArrowLeft') prevImage();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxOpen]);

  const openLightbox = (index: number) => {
    setCurrentImageIndex(index);
    setLightboxOpen(true);
  };

  const nextImage = () => {
    if (listing?.listing_images) {
      setCurrentImageIndex((prev) => (prev + 1) % listing.listing_images.length);
    }
  };

  const prevImage = () => {
    if (listing?.listing_images) {
      setCurrentImageIndex((prev) => (prev - 1 + listing.listing_images.length) % listing.listing_images.length);
    }
  };

  const toggleFavorite = () => {
    if (!id) return;
    const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    const newFavorites = isFavorite 
      ? favorites.filter((f: string) => f !== id)
      : [...favorites, id];
    localStorage.setItem('favorites', JSON.stringify(newFavorites));
    setIsFavorite(!isFavorite);
  };

  const handleContactClick = () => {
    incrementContactClicks();
    if (listing?.host?.phone) {
      window.open(`https://wa.me/${listing.host.phone.replace(/[^0-9]/g, '')}`, '_blank');
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !id) return;
    
    setSubmittingReview(true);
    const { error } = await submitReview(reviewStars, reviewComment, user.id);
    setSubmittingReview(false);
    
    if (!error) {
      setReviewFormOpen(false);
      setReviewComment('');
      setReviewStars(5);
      await refetchReviews();
    }
  };

  // Loading skeleton
  if (loading) {
    return (
      <div className="listing-page">
        <header className="header">
          <div className="logo" onClick={() => navigate('/')}>
            <img src="/src/assets/logo.png" alt="Bayti" />
          </div>
        </header>
        <div className="listing-skeleton" style={{ paddingTop: '100px', maxWidth: '1200px', margin: '0 auto', padding: '100px 2rem 2rem' }}>
          <div style={{ height: '400px', background: '#e2e8f0', borderRadius: '16px', marginBottom: '1rem' }} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
            {[...Array(4)].map((_, i) => (
              <div key={i} style={{ height: '100px', background: '#e2e8f0', borderRadius: '12px' }} />
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '2rem' }}>
            <div>
              <div style={{ height: '40px', background: '#e2e8f0', borderRadius: '8px', marginBottom: '1rem' }} />
              <div style={{ height: '100px', background: '#e2e8f0', borderRadius: '8px', marginBottom: '1rem' }} />
              <div style={{ height: '200px', background: '#e2e8f0', borderRadius: '8px' }} />
            </div>
            <div style={{ height: '300px', background: '#e2e8f0', borderRadius: '16px' }} />
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !listing) {
    return (
      <div className="listing-page">
        <header className="header">
          <div className="logo" onClick={() => navigate('/')}>
            <img src="/src/assets/logo.png" alt="Bayti" />
          </div>
          <nav className={`desktop-nav`}>
            {user ? (
              <>
                <a href="/become-a-host" onClick={(e) => { e.preventDefault(); navigate('/become-a-host'); }}>Become a host</a>
                <a href="/favorites" onClick={(e) => { e.preventDefault(); navigate('/favorites'); }}>Favorites</a>
                <span>{profile?.full_name}</span>
              </>
            ) : (
              <a href="/signin" onClick={(e) => { e.preventDefault(); navigate('/signin'); }}>Sign in</a>
            )}
          </nav>
        </header>
        <div className="error-container" style={{ paddingTop: '120px', textAlign: 'center' }}>
          <h2>Listing not found</h2>
          <p>{error || 'This property may have been removed or expired.'}</p>
          <button className="btn-primary" onClick={() => navigate('/search')} style={{ marginTop: '1rem' }}>
            Browse Listings
          </button>
        </div>
      </div>
    );
  }

  const images = listing.listing_images?.sort((a, b) => a.display_order - b.display_order) || [];
  const amenities = listing.listing_amenities?.map(a => a.amenity) || [];

  return (
    <div className="listing-page">
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
              <a href="/favorites" onClick={(e) => { e.preventDefault(); setMobileMenuOpen(false); navigate('/favorites'); }}>Favorites</a>
              <a href="#" onClick={(e) => { e.preventDefault(); setMobileMenuOpen(false); }}>{profile?.full_name || 'Account'}</a>
            </>
          ) : (
            <a href="/signin" onClick={(e) => { e.preventDefault(); setMobileMenuOpen(false); navigate('/signin'); }}>Sign in</a>
          )}
        </nav>
      </header>

      <div className="listing-content">
        {/* Image Gallery */}
        <div className="images-section">
          {images.length > 0 ? (
            <>
              <div 
                className="main-image" 
                style={{ 
                  backgroundImage: `url(${images[0]?.url})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }}
                onClick={() => openLightbox(0)}
              />
              {images.length > 1 && (
                <div className="small-images">
              {images.slice(1, 4).map((img, i) => (
                <div 
                  key={i}
                  className="small-img" 
                  style={{ 
                    backgroundImage: `url(${img.url})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                  }}
                  onClick={() => openLightbox(i + 1)}
                />
              ))}
                </div>
              )}
            </>
          ) : (
            <div className="main-image" style={{ background: 'linear-gradient(135deg, #0891b2, #06b6d4)' }} />
          )}
        </div>

        <div className="details-section">
          <div className="main-details">
            <div className="title-section">
              <h1>{listing.title}</h1>
              <div className="location-rating">
                <span className="location"><MapPinIcon size={16} /> {listing.wilaya}</span>
                {listing.reviews_avg && listing.reviews_avg > 0 && (
                  <span className="rating"><StarIcon size={16} filled /> {listing.reviews_avg} ({listing.reviews_count} reviews)</span>
                )}
              </div>
            </div>

            <div className="features">
              <div className="feature">
                <BedIcon size={20} />
                <span>{listing.bedrooms} Bedroom{listing.bedrooms !== 1 ? 's' : ''}</span>
              </div>
              <div className="feature">
                <ShowerIcon size={20} />
                <span>{listing.bathrooms} Bathroom{listing.bathrooms !== 1 ? 's' : ''}</span>
              </div>
              <div className="feature">
                <AreaIcon size={20} />
                <span>{listing.area} m²</span>
              </div>
            </div>

            {listing.description && (
              <div className="description">
                <h2>About this property</h2>
                <p>{listing.description}</p>
              </div>
            )}

            {amenities.length > 0 && (
              <div className="amenities">
                <h2>Amenities</h2>
                <div className="amenities-grid">
                  {amenities.map((amenity) => (
                    <span key={amenity} className="amenity-tag">
                      {amenity.charAt(0).toUpperCase() + amenity.slice(1)}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Reviews Section */}
            <div className="reviews-section">
              <h2>Reviews ({reviews.length})</h2>
              
              {user && !reviewFormOpen && (
                <button className="btn-secondary" onClick={() => setReviewFormOpen(true)}>
                  Write a Review
                </button>
              )}

              {reviewFormOpen && (
                <form className="review-form" onSubmit={handleSubmitReview}>
                  <div className="star-input">
                    <label>Your Rating</label>
                    <div className="stars">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          className={`star-btn ${star <= reviewStars ? 'active' : ''}`}
                          onClick={() => setReviewStars(star)}
                        >
                          <StarIcon size={24} filled={star <= reviewStars} />
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Comment (optional)</label>
                    <textarea
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      placeholder="Share your experience..."
                      rows={3}
                    />
                  </div>
                  <div className="form-actions">
                    <button type="button" className="btn-text" onClick={() => setReviewFormOpen(false)}>
                      Cancel
                    </button>
                    <button type="submit" className="btn-primary" disabled={submittingReview}>
                      {submittingReview ? 'Submitting...' : 'Submit Review'}
                    </button>
                  </div>
                </form>
              )}

              <div className="reviews-list">
                {reviewsLoading ? (
                  <p>Loading reviews...</p>
                ) : reviews.length === 0 ? (
                  <p className="no-reviews">No reviews yet. Be the first to review!</p>
                ) : (
                  reviews.map((review) => (
                    <div key={review.id} className="review-item">
                      <div className="review-header">
                        <div className="reviewer">
                          <UserIcon size={20} />
                          <span>{review.author?.full_name || 'Anonymous'}</span>
                        </div>
                        <div className="review-stars">
                          {[...Array(5)].map((_, i) => (
                            <StarIcon key={i} size={14} filled={i < review.stars} />
                          ))}
                        </div>
                      </div>
                      {review.comment && <p className="review-comment">{review.comment}</p>}
                      <span className="review-date">
                        {new Date(review.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Map Section */}
            {listing.latitude && listing.longitude && (
              <div className="map-section">
                <h2>Location</h2>
                <div className="map-container">
                  <iframe
                    title={`Map of ${listing.wilaya}`}
                    src={`https://www.openstreetmap.org/export/embed.html?bbox=${listing.longitude - 0.1}%2C${listing.latitude - 0.1}%2C${listing.longitude + 0.1}%2C${listing.latitude + 0.1}&layer=mapnik&marker=${listing.latitude}%2C${listing.longitude}`}
                    style={{ border: 0, width: '100%', height: '100%' }}
                    allowFullScreen
                    loading="lazy"
                  />
                </div>
              </div>
            )}

            {/* Contact Section */}
            <div className="owner-section">
              <h2>Contact Host</h2>
              <div className="host-info">
                <div className="host-avatar">
                  <UserIcon size={40} />
                </div>
                <div className="host-details">
                  <p className="host-name">{listing.host?.full_name || 'Host'}</p>
                  <p className="host-phone">{listing.host?.phone || 'Phone not available'}</p>
                </div>
              </div>
              <button className="contact-btn whatsapp" onClick={handleContactClick}>
                <PhoneIcon size={20} />
                Contact via WhatsApp
              </button>
            </div>
          </div>

          {/* Booking Card */}
          <div className="booking-card">
            <div className="price-tag">
              <span className="amount">{listing.price.toLocaleString()}</span>
              <span className="period">DA/month</span>
            </div>
            <div className="stats">
              <div className="stat">
                <span className="stat-value">{listing.views}</span>
                <span className="stat-label">views</span>
              </div>
              <div className="stat">
                <span className="stat-value">{listing.contact_clicks}</span>
                <span className="stat-label">contacts</span>
              </div>
            </div>
            <button 
              className={`fav-btn ${isFavorite ? 'favorited' : ''}`} 
              onClick={toggleFavorite}
            >
              <HeartIcon size={16} filled={isFavorite} />
              {isFavorite ? 'Saved' : 'Save to Favorites'}
            </button>
          </div>
        </div>
      </div>

      {/* Lightbox */}
      {lightboxOpen && images.length > 0 && (
        <div className="lightbox-overlay" onClick={() => setLightboxOpen(false)}>
          <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
            <button className="lightbox-close" onClick={() => setLightboxOpen(false)}>×</button>
            <button className="lightbox-nav lightbox-prev" onClick={prevImage}>‹</button>
            <img 
              src={images[currentImageIndex]?.url} 
              alt={`Image ${currentImageIndex + 1}`}
              className="lightbox-image"
            />
            <button className="lightbox-nav lightbox-next" onClick={nextImage}>›</button>
            <div className="lightbox-counter">
              {currentImageIndex + 1} / {images.length}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Listing;
