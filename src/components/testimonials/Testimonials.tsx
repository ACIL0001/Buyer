"use client";

import React from 'react';
import { motion } from 'framer-motion';

const testimonials = [
  {
    id: 1,
    name: "Anis B",
    role: "Responsable commercial chez x",
    title: "“ Excellente plateforme ! “",
    text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore",
    avatar: "https://i.pravatar.cc/150?u=anis"
  },
  {
    id: 2,
    name: "Sophie T",
    role: "Artisane chez Sophie creation",
    title: "“ Je vends facilement! “",
    text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore",
    avatar: "https://i.pravatar.cc/150?u=sophie"
  },
  {
    id: 3,
    name: "Karim F",
    role: "Chef de projet chez AB",
    title: "“ J'ai plus d clarté“",
    text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore",
    avatar: "https://i.pravatar.cc/150?u=karim"
  }
];

const Testimonials = () => {
  return null; // Temporarily hidden as per user request
  return (
    <div style={{ width: '100%', background: '#ffffff', padding: '100px 20px', fontFamily: '"DM Sans", sans-serif' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '80px' }}>
          <h2 style={{ color: '#002896', fontSize: 'clamp(28px, 5vw, 42px)', fontWeight: '700', marginBottom: '20px' }}>
            Ce que disent nos clients
          </h2>
          <p style={{ color: '#64748b', fontSize: '16px', maxWidth: '600px', margin: '0 auto', lineHeight: '1.6' }}>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit<br/>
            sed do eiusmod tempor incididunt ut labore
          </p>
        </div>

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', 
          gap: '20px' 
        }}>
          {testimonials.map((item) => (
            <motion.div
              key={item.id}
              whileHover={{ translateY: -10 }}
              style={{
                background: '#f8f9fb',
                borderRadius: '32px',
                padding: '10px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                boxShadow: '0 10px 40px rgba(0, 0, 0, 0.02)',
                width: '100%',
                maxWidth: '408px',
                height: '432px',
                margin: '0 auto'
              }}
            >
              <div style={{ 
                width: '70px', 
                height: '70px', 
                borderRadius: '50%', 
                overflow: 'hidden',
                background: '#e2e8f0'
              }}>
                <img 
                  src={item.avatar} 
                  alt={item.name} 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                />
              </div>

              <div>
                <h3 style={{ color: '#0ea5e9', fontSize: '20px', fontWeight: '700', marginBottom: '12px' }}>
                  {item.title}
                </h3>
                <p style={{ color: '#64748b', fontSize: '15px', lineHeight: '1.6', marginBottom: '25px' }}>
                  {item.text}
                </p>
              </div>

              <div style={{ marginTop: 'auto' }}>
                <div style={{ color: '#002896', fontSize: '17px', fontWeight: '700', marginBottom: '4px' }}>
                  {item.name}
                </div>
                <div style={{ color: '#94a3b8', fontSize: '14px', fontWeight: '600' }}>
                  {item.role}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Testimonials;
