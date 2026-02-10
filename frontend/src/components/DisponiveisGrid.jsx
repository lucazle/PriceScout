import React from 'react';

function DisponiveisGrid({ notebooks, onMonitorar }) {

    if (!notebooks || notebooks.length === 0) {
        return <p style={{ padding: 20 }}>Carregando produtos...</p>;
    }

    return (
        <div style={styles.grid}>
            {notebooks.map(produto => (
                <div key={produto.id} style={styles.card}>

                    {/* Caixa fixa da imagem */}
                    <div style={styles.imageBox}>
                        <img
                            src={produto.url_imagem || "https://placehold.co/300x200/png?text=Sem+Foto"}
                            alt={produto.nome_produto}
                            style={styles.image}
                        />
                    </div>

                    <p style={styles.name}>
                        {produto.nome_produto}
                    </p>

                    <button
                        onClick={() => onMonitorar(produto)}
                        style={styles.button}
                    >
                        Monitorar
                    </button>

                </div>
            ))}
        </div>
    );
}


const styles = {

    /* Grid apenas (sem container externo) */
    grid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '28px',
        width: '100%',
        maxWidth: '1000px',
        margin: '0 auto',
        padding: '20px 0',
    },

    /* Card */
    card: {
        backgroundColor: '#ffffff',
        borderRadius: '18px',
        padding: '22px 18px 26px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        border: '1px solid #eee',
        boxShadow: '0 8px 24px rgba(0,0,0,0.04)',
        minHeight: '340px',
    },

    /* Área padrão da imagem */
    imageBox: {
        width: '100%',
        height: '170px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '16px',
    },

    /* Imagem padronizada */
    image: {
        maxWidth: '190px',
        maxHeight: '140px',
        objectFit: 'contain',
    },

    /* Nome */
    name: {
        fontSize: '14px',
        fontWeight: 600,
        color: '#1e2330',
        textAlign: 'center',
        minHeight: '40px',
        marginBottom: '18px',
    },

    /* Botão */
    button: {
        backgroundColor: '#10193a',
        color: '#fff',
        border: 'none',
        padding: '10px 28px',
        borderRadius: '10px',
        cursor: 'pointer',
        fontWeight: 700,
        fontSize: '13px',
        marginTop: 'auto',
    },
};


export default DisponiveisGrid;
