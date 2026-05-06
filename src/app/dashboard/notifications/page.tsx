'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  BsBell, 
  BsCheck2All, 
  BsCart3, 
  BsCheckCircle, 
  BsChatLeftText, 
  BsStarFill, 
  BsXCircle,
  BsBagCheck
} from 'react-icons/bs';
import './notifications-styles.css';

// Mock notifications for initial design preview (matches screenshot)
const MOCK_NOTIFICATIONS = [
  {
    _id: '1',
    title: "Nouvelle demande d'achat",
    message: "Anis A souhaite acheter votre MacBook Air M2 13\" pour 11500 Da.",
    type: 'ORDER',
    read: false,
    createdAt: new Date(Date.now() - 5 * 60000).toISOString(),
    category: 'ORDER'
  },
  {
    _id: '2',
    title: "Demande acceptée",
    message: "Votre demande d’achat de Produit A 9500 Da a été validée.",
    type: 'OFFER_ACCEPTED',
    read: true,
    createdAt: new Date(Date.now() - 30 * 60000).toISOString(),
    category: 'PURCHASE',
    thumb: '/assets/img/logo.png'
  },
  {
    _id: '3',
    title: "Nouveau message",
    message: "Bonjour, merci d’avoir accepté ma demande",
    type: 'CHAT',
    read: true,
    createdAt: new Date(Date.now() - 60 * 60000).toISOString(),
    category: 'CHAT',
    sender: { name: 'Emma Leroy', avatar: '/assets/img/logo.png' }
  },
  {
    _id: '4',
    title: "Évaluation reçue",
    message: "Anis A vous a laissé une évaluation de 5 étoiles pour la vente récente.",
    type: 'RATING',
    read: true,
    createdAt: new Date(Date.now() - 120 * 60000).toISOString(),
    category: 'SYSTEM',
    rating: 5
  },
  {
    _id: '5',
    title: "Offre rejetée",
    message: "Votre offre pour le Canon EOS R50 n'a pas été acceptée par le vendeur.",
    type: 'OFFER_REJECTED',
    read: true,
    createdAt: new Date(Date.now() - 240 * 60000).toISOString(),
    category: 'OFFER',
    thumb: '/assets/img/logo.png'
  }
];

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);
  const [filter, setFilter] = useState('Toutes');
  const [loading, setLoading] = useState(false);

  const filters = ['Toutes', 'Enchères', 'Ventes', 'Messages', 'Système'];

  const getFilteredNotifications = () => {
    if (filter === 'Toutes') return notifications;
    if (filter === 'Enchères') return notifications.filter(n => n.type.includes('BID') || n.type.includes('AUCTION'));
    if (filter === 'Ventes') return notifications.filter(n => n.type === 'ORDER' || n.type === 'OFFER_ACCEPTED');
    if (filter === 'Messages') return notifications.filter(n => n.type === 'CHAT');
    if (filter === 'Système') return notifications.filter(n => n.type === 'SYSTEM' || n.type === 'RATING');
    return notifications;
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'ORDER': return { icon: <BsCart3 size={20} />, className: 'figma-notif-icon-blue' };
      case 'OFFER_ACCEPTED': return { icon: <BsCheckCircle size={20} />, className: 'figma-notif-icon-green' };
      case 'CHAT': return { icon: <BsChatLeftText size={20} />, className: 'figma-notif-icon-yellow' };
      case 'RATING': return { icon: <BsStarFill size={20} />, className: 'figma-notif-icon-purple' };
      case 'OFFER_REJECTED': return { icon: <BsXCircle size={20} />, className: 'figma-notif-icon-red' };
      default: return { icon: <BsBell size={20} />, className: 'figma-notif-icon-blue' };
    }
  };

  const formatTime = (dateString: string) => {
    const diff = Math.floor((new Date().getTime() - new Date(dateString).getTime()) / 60000);
    if (diff < 60) return `${diff} min ago`;
    if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
    return `${Math.floor(diff / 1440)}d ago`;
  };

  return (
    <div className="figma-notifications-main">
      {/* Header */}
      <header className="figma-notif-header">
        <div className="figma-notif-title-group">
          <h1 className="figma-notif-title">Centre de notifications</h1>
          <p className="figma-notif-subtitle">
            Gérez vos activités de vente, d'achat et les messages de la communauté.
          </p>
        </div>
        <button className="figma-mark-read-btn">
          <BsCheck2All size={18} />
          Tout marquer comme lu
        </button>
      </header>

      {/* Filters */}
      <nav className="figma-notif-filters">
        {filters.map(f => (
          <button 
            key={f}
            className={`figma-filter-btn ${filter === f ? 'active' : ''}`}
            onClick={() => setFilter(f)}
          >
            {f}
          </button>
        ))}
      </nav>

      {/* Notification List */}
      <div className="figma-notif-list">
        {getFilteredNotifications().map((notif) => {
          const { icon, className } = getIcon(notif.type);
          return (
            <div key={notif._id} className={`figma-notif-card ${!notif.read ? 'unread' : ''}`}>
              <div className={`figma-notif-icon-box ${className}`}>
                {icon}
              </div>
              
              <div className="figma-notif-content">
                <div className="figma-notif-top-row">
                  <h3 className="figma-notif-category">{notif.title}</h3>
                  <span className="figma-notif-time">{formatTime(notif.createdAt)}</span>
                </div>
                
                <p className={`figma-notif-message ${notif.type === 'OFFER_ACCEPTED' || notif.type === 'OFFER_REJECTED' ? 'figma-notif-message-light' : ''}`}>
                  {notif.type === 'CHAT' && notif.sender && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <img src={notif.sender.avatar} alt={notif.sender.name} style={{ width: '24px', height: '24px', borderRadius: '50%' }} />
                      <strong style={{ fontSize: '12px', color: '#334155' }}>{notif.sender.name}</strong>
                    </span>
                  )}
                  {notif.message}
                </p>

                {notif.type === 'CHAT' && (
                  <div className="figma-notif-quote">
                    "Bonjour, merci d'avoir accepté ma demande"
                  </div>
                )}

                {notif.rating && (
                  <div className="figma-notif-rating">
                    {[...Array(notif.rating)].map((_, i) => <BsStarFill key={i} size={14} />)}
                  </div>
                )}

                <div className="figma-notif-actions">
                  {notif.type === 'ORDER' && (
                    <>
                      <button className="figma-btn-notif figma-btn-notif-success">Accepter</button>
                      <button className="figma-btn-notif figma-btn-notif-secondary">Contacter</button>
                    </>
                  )}
                  {notif.type === 'OFFER_ACCEPTED' && (
                    <button className="figma-btn-notif figma-btn-notif-secondary">Contacter</button>
                  )}
                  {notif.type === 'CHAT' && (
                    <button className="figma-btn-notif figma-btn-notif-primary">Répondre</button>
                  )}
                  {notif.type === 'RATING' && (
                    <button className="figma-btn-notif figma-btn-notif-secondary">Voir l'avis</button>
                  )}
                  {notif.type === 'OFFER_REJECTED' && (
                    <button className="figma-btn-notif figma-btn-notif-outline">Proposer un autre prix</button>
                  )}
                </div>
              </div>

              {notif.thumb && (
                <img src={notif.thumb} alt="Product" className="figma-notif-thumb" />
              )}
            </div>
          );
        })}
      </div>

      {/* Empty State / Footer Spacer */}
      <div className="figma-notif-footer-spacer">
        <h4 className="figma-notif-footer-title">Historique complet</h4>
        <p className="figma-notif-footer-text">
          Vous avez vu toutes vos notifications récentes.
        </p>
      </div>
    </div>
  );
}
