import React from 'react';
import { Outlet, useNavigate, Link, useLocation } from 'react-router-dom';
import Header from './Header';
import LojasMonitoradas from './LojasMonitoradas';
import { FaSearch, FaExchangeAlt } from 'react-icons/fa';

function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div style={styles.wrapper}>
      {/* === HEADER === */}
      <Header />

      {/* === CONTEÚDO PRINCIPAL === */}
      <div style={styles.dashboardContainer}>
        
        {/* === COLUNA ESQUERDA (NAV - FIXA) === */}
        <aside style={styles.leftNavColumn}>
          
          <Link to="/procurar" style={{ textDecoration: 'none' }}>
            <div style={location.pathname === '/procurar' ? styles.navCardActive : styles.navCard}>
              <FaSearch size={20} color={location.pathname === '/procurar' ? "#3b5998" : "#555"} />
              <span style={{...styles.navTitle, color: location.pathname === '/procurar' ? "#3b5998" : "#333"}}>
                Procurar Notebooks
              </span>
            </div>
          </Link>

          <Link to="/dashboard" style={{ textDecoration: 'none' }}>
            <div style={location.pathname === '/dashboard' ? styles.navCardActive : styles.navCard}>
              <FaSearch size={20} color={location.pathname === '/dashboard' ? "#3b5998" : "#555"} />
              <span style={{...styles.navTitle, color: location.pathname === '/dashboard' ? "#3b5998" : "#333"}}>
                Dashboard
              </span>
            </div>
          </Link>

          <div style={styles.navCard} onClick={() => navigate('/comparar')}>
            <FaExchangeAlt size={20} color="#555" />
            <span style={styles.navTitle}>Comparar Notebooks</span>
          </div>
        </aside>

        {/* === COLUNA PRINCIPAL (CENTRO - ROLA) === */}
        <main style={styles.mainColumn}>
          <Outlet />
        </main>

        {/* === COLUNA DA BARRA LATERAL (DIREITA - FIXA) === */}
        <aside style={styles.sidebarColumn}>
          <LojasMonitoradas />
        </aside>

      </div>
    </div>
  );
}

const styles = {
  wrapper: {
    minHeight: '100vh',
    backgroundColor: '#f5f5f5',
  },
  dashboardContainer: {
    display: 'grid',
    gridTemplateColumns: '260px 1fr 320px',
    gap: '30px',
    alignItems: 'start',
    padding: '30px',
    maxWidth: '1600px',
    margin: '0 auto',
  },
  leftNavColumn: {
    top: '100px',
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
    height: 'fit-content',
  },
  mainColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    minHeight: '80vh',
  },
  sidebarColumn: {
    top: '100px',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    height: 'fit-content',
  },
  navCard: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    padding: '18px 24px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    border: '1px solid transparent',
  },
  navCardActive: {
    backgroundColor: '#f0f7ff',
    borderRadius: '12px',
    padding: '18px 24px',
    boxShadow: '0 2px 8px rgba(59, 89, 152, 0.1)',
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    border: '1px solid #3b5998',
  },
  navTitle: {
    fontSize: '15px',
    fontWeight: '600',
    color: '#333',
  },
};

export default MainLayout;