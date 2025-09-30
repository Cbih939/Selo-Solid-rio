import React, { useState, useEffect } from 'react';
import styles from './OngDashboard.module.css';
import DashboardCard from '../../../components/ui/DashboardCard/DashboardCard';
import { ICONS } from '../../../assets/icons/ICONS';
import logoPlaceholder from '../../../assets/images/logo.png';
import api from '../../../api/api'; // Importa a instância do axios

const OngDashboard = ({ user, onNavigate }) => {
  // Estado para armazenar os detalhes da ONG buscados da API
  const [ongDetails, setOngDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const cards = [
    { id: 'create_user', title: 'Cadastrar Beneficiário', icon: ICONS.addUser },
    { id: 'list_ong_users', title: 'Listar Beneficiários', icon: ICONS.list },
    { id: 'acceptance', title: 'Tela de Aceite', icon: ICONS.seal },
    { id: 'help', title: 'Ajuda', icon: ICONS.help },
  ];

  // Efeito que busca os dados da ONG quando o componente é montado
  useEffect(() => {
    // Só executa se tivermos um usuário e um ID de ONG
    if (user && user.ong_id) {
      const fetchOngDetails = async () => {
        try {
          // Faz a requisição para a rota que busca uma ONG por ID
          const response = await api.get(`/ongs/${user.ong_id}`);
          setOngDetails(response.data); // Salva os dados da ONG no estado
        } catch (error) {
          console.error("Erro ao buscar os detalhes da ONG:", error);
          // Em caso de erro, podemos manter os dados nulos para usar o placeholder
        } finally {
          setIsLoading(false);
        }
      };

      fetchOngDetails();
    } else {
      setIsLoading(false); // Se não houver ong_id, apenas para de carregar
    }
  }, [user]); // Depende do objeto 'user'

  // Constrói as variáveis com base nos dados buscados (ou usa placeholders)
  const ongName = ongDetails?.fantasy_name || 'ONG';
  
  // Constrói a URL completa da imagem, apontando para o seu backend
  const ongLogo = ongDetails?.logo_url 
    ? `${process.env.REACT_APP_API_URL}${ongDetails.logo_url}` 
    : logoPlaceholder;

  // Mostra uma mensagem de carregamento enquanto busca os dados
  if (isLoading) {
    return <div>A carregar dados da OSC...</div>;
  }

  return (
    <div>
      <div className={styles.header}>
        <img src={ongLogo} alt={`Logótipo da ${ongName}`} className={styles.logo} />
        <h1 className={styles.title}>Painel Administrativo - {ongName}</h1>
      </div>
      <div className={styles.grid}>
        {cards.map(card => (
          <DashboardCard
            key={card.id}
            title={card.title}
            icon={card.icon}
            onClick={() => onNavigate(card.id)}
          />
        ))}
      </div>
    </div>
  );
};

export default OngDashboard;
