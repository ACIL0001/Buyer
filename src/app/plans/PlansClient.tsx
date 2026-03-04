"use client";

import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SubscriptionAPI } from '@/app/api/subscription';
import { SubscriptionPlan } from '@/app/api/subscription';
import './plans.css';
import { useRouter } from 'next/navigation';
import useAuth from '@/hooks/useAuth';

export default function PlansClient() {
  const { t, i18n } = useTranslation();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { isLogged } = useAuth();

  const translate = (key: string, fallback: string) => {
    const result = t(key);
    return result === key ? fallback : result;
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const res = await SubscriptionAPI.getPlans();
      // Ensure we have an array (filtering out inactive plans)
      const data = Array.isArray(res?.data) ? res.data : [];
      const activePlans = data.filter(plan => plan.isActive);
      setPlans(activePlans);
    } catch (error) {
      console.error("Error fetching subscription plans", error);
    } finally {
      setLoading(false);
    }
  };

  const currentLang = i18n.language || 'fr';

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat(currentLang === 'fr' ? 'fr-FR' : currentLang === 'ar' ? 'ar-DZ' : 'en-US', {
      maximumFractionDigits: 0
    }).format(price);
  };

  const handleSubscribe = (planId?: string) => {
    if (!isLogged) {
      router.push('/auth/login?redirect=/plans');
      return;
    }
    // Typically direct to a checkout or payment page, or trigger an API
    // For now we could just go to user workspace or open a payment modal
    // Currently, let's redirect them to their settings or a specific checkout if we had one
    router.push(`/plans/subscribe/${planId}`);
  };

  if (loading) {
    return (
      <div className="plans-page-wrapper loading-container">
        <div className="spinner"></div>
        <div style={{ color: '#94a3b8', fontSize: '1.2rem' }}>
          {translate('common.loading', 'Chargement...')}
        </div>
      </div>
    );
  }

  const getFeatureIcon = (text: string) => {
    const lowerText = String(text).toLowerCase();
    
    // Service rapide / Fast / Priority
    if (lowerText.includes('rapide') || lowerText.includes('fast') || lowerText.includes('speed') || lowerText.includes('priorité') || lowerText.includes('priority')) {
      return (
        <svg className="plan-feature-icon" width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="none">
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
        </svg>
      );
    }
    
    // Service client / Support
    if (lowerText.includes('client') || lowerText.includes('support') || lowerText.includes('assistance') || lowerText.includes('service')) {
      return (
        <svg className="plan-feature-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 18v-6a9 9 0 0 1 18 0v6"></path>
          <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"></path>
        </svg>
      );
    }
    
    // Default: Checkmark in a circle (like the screenshot)
    return (
      <svg className="plan-feature-icon" width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="none">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"></path>
      </svg>
    );
  };

  return (
    <div className="plans-page-wrapper">
      <div className="plans-header">
        <h1 className="plans-title">{translate('navigation.plans', 'Nos Plans')}</h1>
        <p className="plans-subtitle">
          {translate('plans.subtitle', 'Choisissez le plan parfait pour vos besoins professionnels et boostez vos ventes dès aujourd\'hui.')}
        </p>
      </div>

      <div className="plans-grid">
        {plans.length === 0 ? (
          <div style={{ textAlign: 'center', width: '100%', gridColumn: '1 / -1', padding: '60px', color: '#94a3b8', fontSize: '1.2rem' }}>
            {translate('plans.noPlans', 'Aucun plan disponible pour le moment.')}
          </div>
        ) : (
          plans.map((plan, index) => {
            const isPopular = index === 1 || plan.price === 0; // Just an example to highlight some plan
            
            let features: string[] = [];
            
            // Only use the benefits array configured by the admin in the database
            if (Array.isArray(plan.benefits) && plan.benefits.length > 0) {
              features = plan.benefits;
            }
            
            return (
              <div key={plan._id || index} className={`plan-card ${isPopular ? 'popular' : ''}`}>
                {isPopular && (
                  <div className="popular-badge">
                    {translate('plans.popular', 'Populaire')}
                  </div>
                )}
                
                <div className="plan-role">{plan.role}</div>
                <h3 className="plan-name">{plan.name}</h3>
                
                <div className="plan-price-wrap">
                  <span className="plan-price">{formatPrice(plan.price)}</span>
                  <span className="plan-currency">DA</span>
                  <span className="plan-duration">
                    / {plan.duration} {plan.duration > 1 ? translate('plans.months', 'mois') : translate('plans.month', 'mois')}
                  </span>
                </div>
                
                <div className="plan-desc">
                  {plan.description}
                </div>
                
                {features.length > 0 && (
                  <ul className="plan-features">
                    {features.map((feature, fIndex) => (
                      <li key={fIndex} className="plan-feature-item">
                        {getFeatureIcon(feature)}
                        {feature}
                      </li>
                    ))}
                  </ul>
                )}
                
                <button 
                  className={`plan-button ${isPopular ? 'plan-button-primary' : 'plan-button-secondary'}`}
                  onClick={() => handleSubscribe(plan._id)}
                >
                  {translate('plans.subscribe', 'S\'abonner')}
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                    <polyline points="12 5 19 12 12 19"></polyline>
                  </svg>
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
