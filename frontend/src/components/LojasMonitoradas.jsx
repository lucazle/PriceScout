// src/components/LojasMonitoradas.jsx
import React from 'react';

function LojasMonitoradas() {
  const lojas = [
    { 
      nome: 'Mercado Livre', 
      pais: 'Brasil', 
      logo: 'https://http2.mlstatic.com/frontend-assets/ui-navigation/5.21.22/mercadolibre/logo__large_plus.png',
      url: 'https://www.mercadolivre.com.br',
      bgColor: '#FFE600'
    },
    { 
      nome: 'Kabum', 
      pais: 'Brasil', 
      logo: 'https://upload.wikimedia.org/wikipedia/commons/a/ad/KaBuM%21_Logo.png',
      url: 'https://www.kabum.com.br',
      bgColor: '#FF6600'
    },
    { 
      nome: 'Magalu', 
      pais: 'Brasil', 
      logo: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTP6HoXrpXtJqWEhS3GXJwGCbmoBJwVqCXtAw&s',
      url: 'https://www.magazineluiza.com.br',
      bgColor: '#0086FF'
    },
  ];

  return (
    <div style={styles.card}>
      <h3 style={styles.title}>Lojas Monitoradas</h3>
      <ul style={styles.list}>
        {lojas.map((loja, index) => (
          <li key={index} style={styles.listItem}>
            <a 
              href={loja.url} 
              target="_blank" 
              rel="noopener noreferrer" 
              style={styles.lojaLink}
            >
              <div style={styles.iconWrapper}>
                <img 
                  src={loja.logo} 
                  alt={loja.nome} 
                  style={styles.logoImage}
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
                <div 
                  style={{
                    ...styles.logoFallback, 
                    backgroundColor: loja.bgColor,
                    display: 'none'
                  }}
                >
                  {loja.nome.charAt(0)}
                </div>
              </div>
              <div style={styles.textWrapper}>
                <span style={styles.lojaNome}>{loja.nome}</span>
                <span style={styles.lojaPais}>{loja.pais}</span>
              </div>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

const styles = {
  card: {
    backgroundColor: '#fff',
    borderRadius: '10px',
    padding: '15px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
  },
  title: {
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#333',
    marginBottom: '12px',
  },
  list: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
  },
  listItem: {
    marginBottom: '8px',
  },
  lojaLink: {
    display: 'flex',
    alignItems: 'center',
    textDecoration: 'none',
    padding: '6px',
    borderRadius: '6px',
    transition: 'background-color 0.2s',
    cursor: 'pointer',
  },
  iconWrapper: {
    marginRight: '10px',
    width: '36px',
    height: '36px',
    borderRadius: '6px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f9fafb',
    padding: '4px',
    position: 'relative',
    flexShrink: 0,
  },
  logoImage: {
    maxWidth: '100%',
    maxHeight: '100%',
    objectFit: 'contain',
  },
  logoFallback: {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
    fontWeight: 'bold',
    fontSize: '16px',
    borderRadius: '6px',
  },
  textWrapper: {
    display: 'flex',
    flexDirection: 'column',
  },
  lojaNome: {
    fontSize: '13px',
    color: '#333',
    fontWeight: '600',
  },
  lojaPais: {
    fontSize: '11px',
    color: '#999',
  },
};

export default LojasMonitoradas;