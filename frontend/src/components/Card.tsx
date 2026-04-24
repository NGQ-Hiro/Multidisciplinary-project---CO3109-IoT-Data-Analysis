import React from 'react';
import styles from './Card.module.css';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'standard' | 'large';
  mode?: 'auto' | 'light' | 'dark';
  elevation?: 'none' | 'subtle' | 'standard' | 'prominent';
  style?: React.CSSProperties;
}

export const Card: React.FC<CardProps> = ({ 
  children, 
  className = '',
  padding = 'standard',
  mode = 'auto',
  elevation = 'subtle',
  style
}) => {
  const combinedClassName = `
    ${styles.card} 
    ${styles[`padding-${padding}`]} 
    ${styles[`elevation-${elevation}`]}
    ${mode !== 'auto' ? `theme-${mode}` : ''}
    ${className}
  `.trim();

  return (
    <div className={combinedClassName} style={style}>
      {children}
    </div>
  );
};
