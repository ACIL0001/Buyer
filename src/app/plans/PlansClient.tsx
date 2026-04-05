"use client";

import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SubscriptionAPI } from '@/app/api/subscription';
import { SubscriptionPlan } from '@/app/api/subscription';
import './plans.css';
import { useRouter } from 'next/navigation';
import useAuth from '@/hooks/useAuth';
import { motion } from 'framer-motion';

export default function PlansClient() {
  const { t, i18n } = useTranslation();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');
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
      const data = Array.isArray(res?.data) ? res.data : [];
      const activePlans = data.filter(plan => plan.isActive);
      setPlans(activePlans);
    } catch (error) {
      console.error("Error fetching subscription plans", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = (planId?: string) => {
    if (!isLogged) {
      router.push('/auth/login?redirect=/plans');
      return;
    }
    router.push(`/plans/subscribe/${planId}`);
  };

  if (loading) {
    return (
      <div className="plans-page-wrapper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="plans-page-wrapper">
      <div className="plans-header" style={{ textAlign: 'center', marginBottom: '60px', padding: '0 20px' }}>
        <h1 className="plans-title" style={{ 
          fontFamily: '"DM Sans", sans-serif', 
          fontWeight: 700, 
          fontSize: 'clamp(32px, 5vw, 56px)', 
          lineHeight: '1.2', 
          textAlign: 'center', 
          margin: '0 auto 24px', 
          width: '100%',
          maxWidth: '900px',
          color: '#002bc5'
        }}>
          Solutions & Abonnements MazadClick.
        </h1>
        <p className="plans-subtitle" style={{ 
          fontFamily: '"Inter", sans-serif', 
          fontWeight: 400, 
          fontSize: '18px', 
          lineHeight: '1.6', 
          textAlign: 'center', 
          color: '#454545', 
          margin: '0 auto 40px', 
          maxWidth: '800px' 
        }}>
          Des packs adaptés à vos besoins, activez votre abonnement en un clic
        </p>
      </div>

      <div className="plan-toggle-container">
        <div className="plan-toggle-wrapper">
          <button 
            className={`toggle-btn ${billingPeriod === 'monthly' ? 'active' : ''}`}
            onClick={() => setBillingPeriod('monthly')}
          >
            Mensuel
          </button>
          <button 
            className={`toggle-btn ${billingPeriod === 'yearly' ? 'active' : ''}`}
            onClick={() => setBillingPeriod('yearly')}
          >
            Annuel
          </button>
        </div>
      </div>

      <div className="plans-grid">
        {plans.length === 0 ? (
          <div style={{ textAlign: 'center', width: '100%', padding: '60px', color: '#94a3b8' }}>
            {translate('plans.noPlans', 'Aucun plan disponible pour le moment.')}
          </div>
        ) : (
          plans.map((plan, index) => {
            const isPopular = index === 1; // Highlighting the middle plan
            const displayPrice = billingPeriod === 'yearly' ? plan.price * 10 : plan.price; // Example discount
            
            let features: string[] = [];
            if (Array.isArray(plan.benefits) && plan.benefits.length > 0) {
              features = plan.benefits;
            } else {
              // Fallback placeholder features to match screenshot style if none in DB
              features = [
                'Lorem ipsum dolor sit amet',
                'Lorem ipsum dolor sit amet',
                'Lorem ipsum dolor sit amet',
                'Lorem ipsum dolor sit amet',
                'Lorem ipsum dolor sit amet'
              ];
            }
            
            return (
              <motion.div 
                key={plan._id || index} 
                className={`plan-card ${isPopular ? 'popular' : ''}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                {isPopular && (
                  <div className="popular-badge">
                    {translate('plans.popular', 'Populaire')}
                  </div>
                )}
                
                <h3 className="plan-name">{plan.name || 'Basique'}</h3>
                
                <div className="plan-price-wrap">
                  <span className="plan-price">{plan.price === 0 ? '0' : plan.price}</span>
                  <span className="plan-currency">Da</span>
                  <span className="plan-duration">/Mois</span>
                </div>
                
                <div className="plan-desc">
                  {plan.description || 'Lorem ipsum dolor sit amet dolor siti conseiller adipiscing elit.'}
                </div>

                <div className="plan-divider"></div>
                
                <ul className="plan-features">
                  {features.map((feature, fIndex) => (
                    <li key={fIndex} className="plan-feature-item">
                      <div className="plan-feature-icon">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                      </div>
                      {feature}
                    </li>
                  ))}
                </ul>
                
                <button 
                  className={`plan-button ${isPopular ? 'plan-button-white' : 'plan-button-primary'}`}
                  onClick={() => handleSubscribe(plan._id)}
                >
                  {translate('plans.subscribe', "S'abonner")}
                </button>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
