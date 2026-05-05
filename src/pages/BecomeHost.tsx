import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../hooks/useAuth';
import { MenuIcon, XIcon, CheckIcon } from '../components/Icons';
import './BecomeHost.css';

interface ListingData {
  id: string;
  host_id: string;
  title: string;
  type: string;
  wilaya: string;
  price: number;
  area: number;
  bedrooms: number;
  bathrooms: number;
  description: string | null;
  status: string;
  views: number;
  contact_clicks: number;
  expires_at: string;
  created_at: string;
}

const wilayas = [
  'Alger', 'Oran', 'Constantine', 'Annaba', 'Blida', 'Batna', 'Bejaia', 'Tizi Ouzou',
  'Mostaganem', 'Tlemcen', 'Setif', 'Biskra', 'Bechar', 'Medea', 'Tebessa'
];

const propertyTypes = ['apartment', 'villa', 'studio', 'house'];

const amenitiesList = [
  { id: 'furnished', label: 'Furnished' },
  { id: 'garden', label: 'Garden' },
  { id: 'garage', label: 'Garage' },
  { id: 'pool', label: 'Swimming Pool' },
  { id: 'ac', label: 'Air Conditioning' },
  { id: 'pets', label: 'Pet Friendly' },
];

const locationTagsList = [
  { id: 'nearBeach', label: 'Near Beach' },
  { id: 'metro', label: 'Near Metro' },
  { id: 'cityCenter', label: 'City Center' },
  { id: 'airport', label: 'Near Airport' },
  { id: 'monument', label: 'Near Monument' },
];

function BecomeHost() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    // Step 1
    title: '',
    propertyType: '',
    wilaya: '',
    price: '',
    area: '',
    bedrooms: '',
    bathrooms: '',
    // Step 2
    amenities: [] as string[],
    locationTags: [] as string[],
    // Step 3
    description: '',
  });

  const updateForm = (field: string, value: string | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleArray = (field: 'amenities' | 'locationTags', value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter(item => item !== value)
        : [...prev[field], value]
    }));
  };

  const nextStep = () => {
    if (currentStep < 3) setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const submitForm = async () => {
    if (!user) {
      setSubmitError('You must be logged in to create a listing');
      return;
    }

    setSubmitting(true);
    setSubmitError('');

    try {
      // Calculate expiry date (30 days from now)
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);

      // 1. Create the listing
      const listingData = {
        host_id: user.id,
        title: formData.title,
        type: formData.propertyType,
        wilaya: formData.wilaya,
        price: parseInt(formData.price),
        area: parseInt(formData.area),
        bedrooms: parseInt(formData.bedrooms),
        bathrooms: parseInt(formData.bathrooms),
        description: formData.description || null,
        status: 'pending' as const,
        views: 0,
        contact_clicks: 0,
        expires_at: expiresAt.toISOString(),
      };
      
      console.log('Creating listing with data:', listingData);
      
      const { data: listingData2, error: listingError } = await supabase
        .from('listings')
        .insert(listingData as any)
        .select()
        .single();

      if (listingError) {
        console.error('Listing creation error:', listingError);
        throw new Error(listingError.message || 'Failed to create listing');
      }
      
      if (!listingData2) {
        throw new Error('No listing returned after creation');
      }
      
      const listing = listingData2 as ListingData;
      
      console.log('Listing created successfully:', listing);

      // 2. Insert amenities
      if (formData.amenities.length > 0 && listing?.id) {
        const { error: amenitiesError } = await supabase
          .from('listing_amenities')
          .insert(
            formData.amenities.map(amenity => ({
              listing_id: listing.id,
              amenity,
            })) as any
          );
        if (amenitiesError) console.error('Error saving amenities:', amenitiesError);
      }

      // 3. Insert location tags
      if (formData.locationTags.length > 0 && listing?.id) {
        const { error: tagsError } = await supabase
          .from('listing_tags')
          .insert(
            formData.locationTags.map(tag => ({
              listing_id: listing.id,
              tag,
            })) as any
          );
        if (tagsError) console.error('Error saving tags:', tagsError);
      }

      setIsSubmitted(true);
    } catch (err) {
      console.error('Error submitting form:', err);
      setSubmitError(err instanceof Error ? err.message : 'Failed to create listing. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const isStep1Valid = formData.title && formData.propertyType && formData.wilaya && 
                       formData.price && formData.area && formData.bedrooms && formData.bathrooms;

  if (isSubmitted) {
    return (
      <div className="become-host-page">
        <header className="header">
          <div className="logo" onClick={() => navigate('/')}>
            <img src="/src/assets/logo.png" alt="Bayti" />
          </div>
        </header>

        <div className="success-container">
          <div className="success-card">
            <div className="success-icon">
              <CheckIcon size={48} />
            </div>
            <h2>Thank You!</h2>
            <p>Your listing has been submitted successfully and is now under review.</p>
            <p className="success-subtitle">We'll notify you once it's approved and published.</p>
            <button className="back-home-btn" onClick={() => navigate('/')}>
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="become-host-page">
      <header className="header">
        <div className="logo" onClick={() => navigate('/')}>
          <img src="/src/assets/logo.png" alt="Bayti" />
        </div>
        <button className="mobile-menu-btn" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          {mobileMenuOpen ? <XIcon size={24} /> : <MenuIcon size={24} />}
        </button>
        <nav className={`desktop-nav ${mobileMenuOpen ? 'mobile-open' : ''}`}>
          <a href="/search" onClick={(e) => { e.preventDefault(); setMobileMenuOpen(false); navigate('/search'); }}>Browse listings</a>
          <a href="#" onClick={() => setMobileMenuOpen(false)} className="active">Become a host</a>
          <a href="/favorites" onClick={(e) => { e.preventDefault(); setMobileMenuOpen(false); navigate('/favorites'); }}>Favorites</a>
          <a href="#" onClick={() => setMobileMenuOpen(false)}>{profile?.full_name || 'Account'}</a>
        </nav>
      </header>

      <div className="host-content">
        <div className="host-header">
          <h1>List Your Property</h1>
          <p>Join thousands of hosts on Bayti</p>
        </div>

        {/* Progress Bar */}
        <div className="progress-bar">
          <div className={`progress-step ${currentStep >= 1 ? 'active' : ''} ${currentStep > 1 ? 'completed' : ''}`}>
            <div className="step-number">1</div>
            <span className="step-label">Property Details</span>
          </div>
          <div className={`progress-line ${currentStep > 1 ? 'completed' : ''}`}></div>
          <div className={`progress-step ${currentStep >= 2 ? 'active' : ''} ${currentStep > 2 ? 'completed' : ''}`}>
            <div className="step-number">2</div>
            <span className="step-label">Amenities</span>
          </div>
          <div className={`progress-line ${currentStep > 2 ? 'completed' : ''}`}></div>
          <div className={`progress-step ${currentStep >= 3 ? 'active' : ''}`}>
            <div className="step-number">3</div>
            <span className="step-label">Description</span>
          </div>
        </div>

        {submitError && (
          <div className="error-banner" style={{ 
            background: '#fef2f2', 
            color: '#dc2626', 
            padding: '1rem', 
            borderRadius: '8px',
            marginBottom: '1rem',
            textAlign: 'center'
          }}>
            {submitError}
          </div>
        )}

        <div className="form-container">
          {/* Step 1: Property Details */}
          {currentStep === 1 && (
            <div className="form-step">
              <h2>Property Details</h2>
              
              <div className="form-group">
                <label>Property Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => updateForm('title', e.target.value)}
                  placeholder="e.g., Modern apartment in city center"
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Property Type *</label>
                  <select value={formData.propertyType} onChange={(e) => updateForm('propertyType', e.target.value)}>
                    <option value="">Select type</option>
                    {propertyTypes.map(type => (
                      <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Wilaya *</label>
                  <select value={formData.wilaya} onChange={(e) => updateForm('wilaya', e.target.value)}>
                    <option value="">Select wilaya</option>
                    {wilayas.map(w => (
                      <option key={w} value={w}>{w}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Price (DA/month) *</label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => updateForm('price', e.target.value)}
                    placeholder="45000"
                    min="1"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Area (m²) *</label>
                  <input
                    type="number"
                    value={formData.area}
                    onChange={(e) => updateForm('area', e.target.value)}
                    placeholder="80"
                    min="1"
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Bedrooms *</label>
                  <input
                    type="number"
                    value={formData.bedrooms}
                    onChange={(e) => updateForm('bedrooms', e.target.value)}
                    placeholder="2"
                    min="0"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Bathrooms *</label>
                  <input
                    type="number"
                    value={formData.bathrooms}
                    onChange={(e) => updateForm('bathrooms', e.target.value)}
                    placeholder="1"
                    min="0"
                    required
                  />
                </div>
              </div>

              <div className="form-actions">
                <button 
                  className="btn-primary" 
                  onClick={nextStep}
                  disabled={!isStep1Valid}
                >
                  Next Step
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Amenities & Location */}
          {currentStep === 2 && (
            <div className="form-step">
              <h2>Amenities & Location</h2>
              
              <div className="form-group">
                <label>Amenities</label>
                <div className="checkbox-grid">
                  {amenitiesList.map(amenity => (
                    <label key={amenity.id} className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={formData.amenities.includes(amenity.id)}
                        onChange={() => toggleArray('amenities', amenity.id)}
                      />
                      <span>{amenity.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label>Location Tags</label>
                <div className="checkbox-grid">
                  {locationTagsList.map(tag => (
                    <label key={tag.id} className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={formData.locationTags.includes(tag.id)}
                        onChange={() => toggleArray('locationTags', tag.id)}
                      />
                      <span>{tag.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="form-actions">
                <button className="btn-secondary" onClick={prevStep}>
                  Back
                </button>
                <button className="btn-primary" onClick={nextStep}>
                  Next Step
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Description */}
          {currentStep === 3 && (
            <div className="form-step">
              <h2>Description</h2>
              
              <div className="form-group">
                <label>Description (Optional)</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => updateForm('description', e.target.value)}
                  placeholder="Tell us more about your property..."
                  rows={6}
                />
              </div>

              <div className="form-actions">
                <button className="btn-secondary" onClick={prevStep}>
                  Back
                </button>
                <button 
                  className="btn-primary" 
                  onClick={submitForm}
                  disabled={submitting}
                >
                  {submitting ? 'Submitting...' : 'Submit Listing'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default BecomeHost;
