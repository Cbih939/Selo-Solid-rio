import React from 'react';

const Icon = ({ path, className = 'icon' }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className={className}>
    <path d={path} />
  </svg>
);

export default Icon;