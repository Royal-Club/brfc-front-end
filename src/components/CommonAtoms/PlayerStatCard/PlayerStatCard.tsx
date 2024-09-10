import React from 'react';
import './PlayerStatCard.css';
import playerCardImage from './../../../assets/playerCard.png';

interface PlayerStatCardProps {
  name: string;
  position: string;
  countryFlag: string;
  stats: {
    pac: number;
    sho: number;
    pas: number;
    dri: number;
    def: number;
    phy: number;
  };
  image: string;
}

const PlayerStatCard: React.FC<PlayerStatCardProps> = ({ name, position, countryFlag, stats, image }) => {
  return (
    <div 
    className='player-stat-card'
    style={{
      backgroundImage: `url(${playerCardImage})`,
      backgroundSize: 'contain',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      height: '500px',
      width: '300px',
      color: "#FFFCBA"
    }}
    
    >
      <div className="card-header">
        <div className="rating">99</div>
    
        <img src={countryFlag} alt="Country Flag" className="country-flag" />
      </div>
      <img src={image} alt={name} className="player-image" />
    <div className='player-info'>
    <h3 className="player-name">{name}   <div className="position">{position}</div></h3>
      <div className="stats">
        <div><strong>PAC</strong> {stats.pac}</div>
        <div><strong>SHO</strong> {stats.sho}</div>
        <div><strong>PAS</strong> {stats.pas}</div>
        <div><strong>DRI</strong> {stats.dri}</div>
        <div><strong>DEF</strong> {stats.def}</div>
        <div><strong>PHY</strong> {stats.phy}</div>
      </div>
    </div>
    </div>
  );
};

export default PlayerStatCard;
