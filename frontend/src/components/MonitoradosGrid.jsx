// src/components/MonitoradosGrid.jsx

import React from 'react';
import { Link } from 'react-router-dom';

const placeholderImg = "https://placehold.co/300x200/png?text=Notebook";

function MonitoradosGrid({
  produtos = [],
  onUnfollow = () => {},
  onEditPrice = () => {},
}) {

  if (!produtos || produtos.length === 0) {
    return <p style={{ padding: 20 }}>Você ainda não monitora nenhum produto.</p>;
  }

  return (
    <div style={styles.wrapper}>

      <div style={styles.container}>

        <h3 style={styles.title}>Notebook Monitorados</h3>

        <div style={styles.grid}>

          {produtos.map((produto) => (

            <div key={produto.id} style={styles.card}>

              {/* Lixeira no topo */}
              <button
                onClick={() => onUnfollow(produto.id)}
                style={styles.trashBtn}
                title="Parar de seguir"
              >
                🗑
              </button>


              {/* Imagem */}
              <div style={styles.imageBox}>
                <img
                  src={produto.url_imagem || placeholderImg}
                  alt={produto.nome_produto}
                  style={styles.image}
                />
              </div>


              {/* Nome */}
              <div style={styles.name}>
                {produto.nome_produto}
              </div>


              {/* Ações */}
              <div style={styles.actions}>

                <Link
                  to={`/produto/${produto.id}`}
                  style={styles.detailsBtn}
                >
                  Ver Detalhes
                </Link>


                <button
                  onClick={() => onEditPrice(produto.id)}
                  style={styles.editBtn}
                  title="Editar meta"
                >
                  ✎
                </button>

              </div>

            </div>

          ))}

        </div>

      </div>

    </div>
  );
}


/* ===========================
   ESTILOS
=========================== */

const styles = {

  wrapper: {
    width: '100%',
    display: 'flex',
    justifyContent: 'center',
  },

  container: {
    width: '100%',
    maxWidth: '1150px',
    background: '#fff',
    borderRadius: '14px',
    padding: '25px',
    boxShadow: '0 3px 8px rgba(0,0,0,0.04)',
    border: '1px solid #eee',
  },

  title: {
    marginBottom: '20px',
    fontSize: '18px',
    fontWeight: 700,
    color: '#1e2330',
  },

  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
    gap: '24px',
  },

  card: {
    position: 'relative',
    backgroundColor: '#fff',
    borderRadius: '12px',
    padding: '18px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    minHeight: '320px',
    border: '1px solid #eee',
    boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
  },



  /* -------- Lixeira -------- */

  trashBtn: {
    position: 'absolute',
    top: '12px',
    right: '12px',
    background: '#fff',
    border: '1px solid #ddd',
    borderRadius: '6px',
    padding: '5px 7px',
    cursor: 'pointer',
    fontSize: '13px',
  },


  /* -------- Imagem -------- */

  imageBox: {
    width: '100%',
    height: '160px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    background: '#fafafa',
    borderRadius: '8px',
    marginBottom: '12px',
  },

  image: {
    width: '180px',
    height: '120px',
    objectFit: 'contain',
  },


  /* -------- Nome -------- */

  name: {
    textAlign: 'center',
    fontSize: '14px',
    fontWeight: 700,
    color: '#1e2330',
    marginBottom: '15px',
    minHeight: '36px',
  },


  /* -------- Botões -------- */

  actions: {
    marginTop: 'auto',
    width: '100%',
    display: 'flex',
    justifyContent: 'center',
    gap: '10px',
  },

  detailsBtn: {
    backgroundColor: '#10193a',
    color: '#fff',
    padding: '8px 18px',
    borderRadius: '8px',
    textDecoration: 'none',
    fontWeight: 700,
    fontSize: '13px',
  },

  editBtn: {
    background: '#10193a',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    padding: '8px 12px',
    cursor: 'pointer',
    fontWeight: 700,
    fontSize: '13px',
  },

};

export default MonitoradosGrid;
