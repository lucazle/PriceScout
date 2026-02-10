// src/pages/ComparacaoDetalhe.jsx
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';
import { FaAmazon, FaExternalLinkAlt } from 'react-icons/fa';
import { SiMercadopago } from 'react-icons/si';

const placeholderImg = "https://placehold.co/400x300/png?text=Notebook";

// Componente para exibir um produto
function ProdutoCard({ produto }) {
  const formatCurrency = (value) => {
    if (value === null || value === undefined || isNaN(Number(value))) return 'N/D';
    return Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const getStoreIcon = (lojaNome) => {
    const lowerName = (lojaNome || '').toLowerCase();
    if (lowerName.includes('amazon')) return <FaAmazon size={24} color="#FF9900" />;
    if (lowerName.includes('mercado livre')) return <SiMercadopago size={24} color="#FFE600" />;
    if (lowerName.includes('magalu')) return <span style={styles.logoText}>M</span>;
    return null;
  };

  const getMelhoresOfertasPorLoja = () => {
    if (!produto?.ofertas || produto.ofertas.length === 0) return [];
    
    const ofertasPorLoja = {};
    produto.ofertas.forEach(oferta => {
      const loja = oferta.loja || 'N/A';
      if (!ofertasPorLoja[loja] || oferta.preco_atual < ofertasPorLoja[loja].preco_atual) {
        ofertasPorLoja[loja] = oferta;
      }
    });
    
    return Object.values(ofertasPorLoja).sort((a, b) => a.preco_atual - b.preco_atual);
  };

  const melhoresOfertas = getMelhoresOfertasPorLoja();

  return (
    <div style={styles.produtoColumn}>
      {/* Informações do Produto */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>{produto.nome_produto}</h2>
        <div style={styles.produtoInfo}>
          <div style={styles.imageContainer}>
            <img 
              src={produto.url_imagem || placeholderImg} 
              alt={produto.nome_produto} 
              style={styles.productImage} 
            />
          </div>
          <div style={styles.specsContainer}>
            <div style={styles.specItem}>
              <span style={styles.specLabel}>CPU:</span>
              <span style={styles.specValue}>{produto.cpu_base || 'N/D'}</span>
            </div>
            <div style={styles.specItem}>
              <span style={styles.specLabel}>RAM:</span>
              <span style={styles.specValue}>{produto.ram_base || 'N/D'}</span>
            </div>
            <div style={styles.specItem}>
              <span style={styles.specLabel}>Armazenamento:</span>
              <span style={styles.specValue}>{produto.armazenamento_base || 'N/D'}</span>
            </div>
            <div style={styles.specItem}>
              <span style={styles.specLabel}>Tela:</span>
              <span style={styles.specValue}>{produto.tela_base ? `${produto.tela_base}"` : 'N/D'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Comparação de Preços */}
      <div style={styles.section}>
        <h2 style={styles.comparacaoTitle}>Preços ({melhoresOfertas.length} lojas)</h2>
        
        {melhoresOfertas.length === 0 ? (
          <p style={styles.noOfertas}>Nenhuma oferta disponível</p>
        ) : (
          <div style={styles.ofertasList}>
            {melhoresOfertas.map((oferta, index) => (
              <div key={index} style={styles.ofertaRow}>
                <div style={styles.ofertaLeft}>
                  <img 
                    src={produto.url_imagem || placeholderImg} 
                    alt={produto.nome_produto} 
                    style={styles.ofertaImage} 
                  />
                  <div style={styles.ofertaInfo}>
                    <div style={styles.ofertaPreco}>
                      {formatCurrency(oferta.preco_atual)}
                    </div>
                    <div style={styles.ofertaLoja}>
                      {getStoreIcon(oferta.loja)}
                      <span style={styles.lojaTexto}>{oferta.loja}</span>
                    </div>
                    <div style={styles.lojaOrigem}>Brasil</div>
                  </div>
                </div>
                
                <a 
                  href={oferta.url} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  style={styles.irLojaBtn}
                >
                  Ir à loja
                </a>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ComparacaoDetalhe() {
  const { id1, id2 } = useParams();
  const [produto1, setProduto1] = useState(null);
  const [produto2, setProduto2] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetalhes = async () => {
      setLoading(true);
      try {
        const res = await api.get('/dashboard');
        const produtos = res.data;
        
        const p1 = produtos.find(p => p.id === parseInt(id1));
        const p2 = produtos.find(p => p.id === parseInt(id2));
        
        setProduto1(p1);
        setProduto2(p2);
      } catch (err) {
        console.error("Erro ao buscar detalhes da comparação", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDetalhes();
  }, [id1, id2]);

  if (loading) return <div style={styles.loading}>Carregando comparação...</div>;
  
  if (!produto1 || !produto2) {
    return <div style={styles.loading}>Produtos não encontrados</div>;
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.pageTitle}>Comparação de Notebooks</h1>
      
      <div style={styles.compareContainer}>
        <ProdutoCard produto={produto1} />
        <ProdutoCard produto={produto2} />
      </div>
    </div>
  );
}

const styles = {
  container: {
    padding: '20px 0',
  },
  loading: {
    padding: '50px',
    textAlign: 'center',
    color: '#666',
    fontSize: '18px',
  },
  pageTitle: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: '30px',
    textAlign: 'center',
  },
  compareContainer: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '30px',
  },
  produtoColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  section: {
    backgroundColor: 'white',
    padding: '25px',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
  },
  sectionTitle: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: '20px',
    borderBottom: '2px solid #f3f4f6',
    paddingBottom: '10px',
  },
  produtoInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  imageContainer: {
    width: '100%',
    height: '200px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: '8px',
    overflow: 'hidden',
  },
  // FIX: força todas as imagens principais do detalhe a terem o mesmo tamanho visual
  productImage: {
    width: '220px',
    height: '160px',
    objectFit: 'contain',
  },
  specsContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  specItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 12px',
    backgroundColor: '#f9fafb',
    borderRadius: '6px',
  },
  specLabel: {
    fontSize: '14px',
    color: '#6b7280',
    fontWeight: '500',
  },
  specValue: {
    fontSize: '14px',
    color: '#111827',
    fontWeight: '600',
  },
  comparacaoTitle: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: '20px',
  },
  ofertasList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0',
  },
  ofertaRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '15px 0',
    borderBottom: '1px solid #e5e7eb',
  },
  ofertaLeft: {
    display: 'flex',
    gap: '15px',
    alignItems: 'center',
    flex: 1,
  },
  ofertaImage: {
    width: '80px',
    height: '60px',
    objectFit: 'contain',
    backgroundColor: '#f9fafb',
    borderRadius: '6px',
    padding: '5px',
  },
  ofertaInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  ofertaPreco: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#1f2937',
  },
  ofertaLoja: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  lojaTexto: {
    fontSize: '13px',
    fontWeight: '500',
    color: '#374151',
  },
  lojaOrigem: {
    fontSize: '11px',
    color: '#9ca3af',
  },
  irLojaBtn: {
    backgroundColor: '#1e2330',
    color: 'white',
    textDecoration: 'none',
    padding: '10px 20px',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '600',
    border: 'none',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    whiteSpace: 'nowrap',
  },
  noOfertas: {
    textAlign: 'center',
    color: '#9ca3af',
    fontSize: '14px',
    padding: '20px',
  },
  logoText: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#0086FF',
    border: '2px solid #0086FF',
    borderRadius: '4px',
    padding: '2px 8px',
  },
};

export default ComparacaoDetalhe;
