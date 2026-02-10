import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import MonitoradosGrid from '../components/MonitoradosGrid.jsx';

// --- Funções Auxiliares ---
function formatCurrency(value) {
  if (value === null || value === undefined || isNaN(Number(value))) return 'N/D';
  return Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
function getMelhorOferta(ofertas) {
  if (!ofertas || ofertas.length === 0) return { preco_atual: null, loja: 'N/A', url: '#' };
  const sortedOfertas = [...ofertas].sort((a, b) => a.preco_atual - b.preco_atual);
  return sortedOfertas[0];
}

// --- Componente Principal do Dashboard ---
import FiltroMonitoramentoModal from '../components/FiltroMonitoramentoModal.jsx';

function Dashboard() {
  const [produtosSeguidos, setProdutosSeguidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scrapingLoading, setScrapingLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [produtoSelecionado, setProdutoSelecionado] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const seguidosRes = await api.get('/dashboard'); 
      setProdutosSeguidos(seguidosRes.data);
    } catch (err) {
      console.error("Erro ao buscar dados", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Abre o modal de edição de filtro, preenchendo com o produto monitorado
  const handleEditPrice = (produtoId) => {
    const produto = produtosSeguidos.find(p => p.id === produtoId);
    setProdutoSelecionado(produto);
    setIsModalOpen(true);
  };

  // Após aplicar filtro, fecha modal e atualiza lista
  const handleFiltroAplicado = () => {
    setIsModalOpen(false);
    setProdutoSelecionado(null);
    fetchData();
  };

  const handleUnfollow = async (produtoId) => {
    if(!confirm("Tem certeza que quer deixar de seguir este produto?")) return;
    try {
      await api.delete(`/products/${produtoId}/follow`);
      fetchData();
    } catch (e) { alert('Erro ao deixar de seguir.'); }
  };

  const handleAtualizarPrecos = async () => {
    setScrapingLoading(true);
    try {
      const response = await api.post('/api/run-scraper');
      alert(response.data.message || 'Preços atualizados com sucesso!');
      fetchData(); // Recarrega os dados
    } catch (err) {
      console.error('Erro ao atualizar preços:', err);
      alert('Erro ao atualizar preços. Tente novamente.');
    } finally {
      setScrapingLoading(false);
    }
  };

  if (loading && !produtosSeguidos.length) return <div style={styles.loading}>Carregando...</div>;

  return (
    <>
      {/* Seção 1: Header e Botão de Atualizar Preços */}
      <div style={styles.headerSection}>
        <h2 style={styles.pageTitle}>Meus Notebooks Monitorados</h2>
        <button 
          onClick={handleAtualizarPrecos} 
          disabled={scrapingLoading}
          style={{
            ...styles.btnAtualizar,
            ...(scrapingLoading ? styles.btnAtualizarDisabled : {})
          }}
        >
          {scrapingLoading ? ' Atualizando...' : ' Atualizar Preços'}
        </button>
      </div>


      {/* Seção 2: Grid de Produtos Seguidos */}
      <MonitoradosGrid 
        produtos={produtosSeguidos} 
        onUnfollow={handleUnfollow} 
        onEditPrice={handleEditPrice} 
      />

      {/* Modal de Filtro para editar filtros do produto monitorado */}
      <FiltroMonitoramentoModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setProdutoSelecionado(null); }}
        produto={produtoSelecionado}
        onFiltroAplicado={handleFiltroAplicado}
      />

      {/* Seção 3: Tabela de Melhores Ofertas */}
      <div style={styles.section}>
        <h3 style={styles.title}>Resumo de Preços</h3>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Produto</th>
              <th style={styles.th}>Melhor Preço Atual</th>
              <th style={styles.th}>Loja</th>
              <th style={styles.th}>Sua Meta</th>
            </tr>
          </thead>
          <tbody>
            {produtosSeguidos.length === 0 ? (
                <tr>
                  <td colSpan="4" style={styles.tdCenter}>
                    Você ainda não monitora nenhum produto. 
                    <Link to="/procurar" style={styles.link}>Clique aqui para começar a monitorar!</Link>
                  </td>
                </tr>
            ) : produtosSeguidos.map(p => {
              const oferta = getMelhorOferta(p.ofertas);
              const precoDesejado = p.preco_maximo_desejado || p.preco_desejado; 
              
              return (
                <tr key={p.id}>
                  <td style={styles.td}>{p.nome_produto}</td>
                  <td style={styles.td}>
                    <a href={oferta.url} target="_blank" rel="noopener noreferrer" style={styles.link}>
                      {formatCurrency(oferta.preco_atual)}
                    </a>
                  </td>
                  <td style={styles.td}>{oferta.loja}</td>
                  <td style={styles.td}>{formatCurrency(precoDesejado)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}

// --- Estilos ---
const styles = {
  loading: { padding: 50, textAlign: 'center', color: '#666', fontSize: 18 },
  section: { backgroundColor: 'white', padding: 25, borderRadius: 10, boxShadow: '0 2px 5px rgba(0,0,0,0.05)', marginTop: 20 },
  title: { fontSize: 18, marginBottom: 15, color: '#333', borderBottom: '1px solid #eee', paddingBottom: 10 },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: 12, borderBottom: '2px solid #eee', color: '#888', fontSize: 12, textTransform: 'uppercase' },
  td: { padding: 12, borderBottom: '1px solid #f5f5f5', fontSize: 14 },
  tdCenter: { padding: 20, textAlign: 'center', color: '#999' },
  link: { color: '#3b5998', textDecoration: 'none', fontWeight: 'bold' },
  headerSection: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  pageTitle: { fontSize: 22, color: '#333', margin: 0 },
  btnAtualizar: { 
    backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: 5, 
    padding: '10px 20px', cursor: 'pointer', fontSize: 16, 
    transition: 'background-color 0.3s'
  },
  btnAtualizarDisabled: { backgroundColor: '#007bff80', cursor: 'not-allowed' },
};

export default Dashboard;