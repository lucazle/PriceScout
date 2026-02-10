// src/pages/Comparar.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const placeholderImg = "https://placehold.co/300x200/png?text=Notebook";

function Comparar() {
  const [produtosMonitorados, setProdutosMonitorados] = useState([]);
  const [selecionados, setSelecionados] = useState([]); // Armazena os IDs
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Busca produtos monitorados pelo usuário
  useEffect(() => {
    const fetchProdutos = async () => {
      setLoading(true);
      try {
        const response = await api.get('/dashboard');
        setProdutosMonitorados(response.data);
      } catch (err) {
        console.error("Erro ao buscar produtos monitorados", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProdutos();
  }, []);

  // Lógica de Seleção
  const handleSelect = (produtoId) => {
    if (selecionados.includes(produtoId)) {
      setSelecionados(selecionados.filter(id => id !== produtoId));
    } else if (selecionados.length < 2) {
      setSelecionados([...selecionados, produtoId]);
    } else {
      alert("Você só pode selecionar 2 notebooks para comparar.");
    }
  };

  // Lógica do botão "Comparar Agora"
  const handleCompare = () => {
    if (selecionados.length === 2) {
      navigate(`/comparar/${selecionados[0]}/${selecionados[1]}`);
    }
  };

  if (loading) return <div style={styles.loading}>Carregando...</div>;

  if (produtosMonitorados.length === 0) {
    return (
      <div style={styles.emptyState}>
        <h3>Você ainda não monitora nenhum notebook</h3>
        <p>Vá para "Procurar Notebooks" para começar a monitorar produtos.</p>
      </div>
    );
  }

  return (
    <>
      <div style={styles.header}>
        <div>
          <h3 style={styles.title}>Comparar Notebooks</h3>
          <p style={styles.subtitle}>
            Selecione 2 notebooks para comparar ({selecionados.length}/2 selecionados)
          </p>
        </div>
        {selecionados.length === 2 && (
          <button style={styles.compareBtn} onClick={handleCompare}>
            Comparar Agora
          </button>
        )}
      </div>

      <div style={styles.grid}>
        {produtosMonitorados.map(produto => {
          const isSelected = selecionados.includes(produto.id);
          return (
            <div 
              key={produto.id} 
              style={{
                ...styles.card,
                ...(isSelected ? styles.cardSelected : {})
              }}
            >
              {isSelected && <div style={styles.selectedBadge}>✓</div>}
              
              <div style={styles.imageContainer}>
                <img 
                  src={produto.url_imagem || placeholderImg} 
                  alt={produto.nome_produto} 
                  style={styles.image} 
                />
              </div>
              
              <h4 style={styles.name}>{produto.nome_produto}</h4>
              
              <button 
                style={isSelected ? styles.btnSelected : styles.btnSelect}
                onClick={() => handleSelect(produto.id)}
              >
                {isSelected ? 'Selecionado' : 'Selecionar para Comparar'}
              </button>
            </div>
          );
        })}
      </div>
    </>
  );
}

const styles = {
  loading: { 
    fontSize: '18px', 
    color: '#666', 
    textAlign: 'center', 
    padding: '50px' 
  },
  emptyState: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    padding: '60px 40px',
    textAlign: 'center',
    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '25px',
    backgroundColor: '#fff',
    borderRadius: '12px',
    padding: '25px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
  },
  title: { 
    fontSize: '22px', 
    fontWeight: '700', 
    color: '#1f2937', 
    margin: 0,
    marginBottom: '5px',
  },
  subtitle: {
    fontSize: '14px',
    color: '#6b7280',
    margin: 0,
  },
  compareBtn: {
    backgroundColor: '#10b981',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    padding: '12px 24px',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
    gap: '30px',
    padding: '20px 0',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: '16px',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    border: '2px solid transparent',
    position: 'relative',
    transition: 'all 0.2s',
    cursor: 'pointer',
  },
  cardSelected: {
    border: '2px solid #1e2330',
    boxShadow: '0 4px 12px rgba(30, 35, 48, 0.2)',
  },
  selectedBadge: {
    position: 'absolute',
    top: '15px',
    right: '15px',
    backgroundColor: '#1e2330',
    color: 'white',
    borderRadius: '50%',
    width: '28px',
    height: '28px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '16px',
    fontWeight: 'bold',
  },
  imageContainer: {
    width: '100%',
    height: '150px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '15px',
  },
  // FIX: força todas as imagens visualmente iguais
  image: {
    width: '180px',
    height: '120px',
    objectFit: 'contain',
    display: 'block',
    margin: '0 auto',
  },
  name: {
    fontSize: '16px',
    fontWeight: '700',
    color: '#111827',
    marginBottom: '20px',
    textAlign: 'center',
  },
  btnSelect: {
    backgroundColor: '#1e2330',
    color: 'white',
    border: 'none',
    padding: '10px 20px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '13px',
    width: '100%',
    transition: 'background-color 0.2s',
  },
  btnSelected: {
    backgroundColor: '#1e2330',
    color: 'white',
    border: 'none',
    padding: '10px 20px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '13px',
    width: '100%',
  }
};

export default Comparar;
