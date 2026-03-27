import React, { useState, useEffect } from 'react';
import ContentWrapper from '../../../components/ui/ContentWrapper/ContentWrapper';
import api from '../../../api/api';
import styles from './HelpPage.module.css';

const HelpPage = ({ user }) => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  // Busca o utilizador das propriedades ou do cache
  const loggedUser = user || JSON.parse(localStorage.getItem('currentUser') || '{}');
  
  // O ID da ONG a pesquisar será o 'ong_id' (se for beneficiário/coordenador) 
  // ou o próprio 'id' caso o objeto não tenha o ong_id mapeado diretamente.
  const ongId = loggedUser?.ong_id || loggedUser?.id;

  useEffect(() => {
    const fetchActivities = async () => {
      if (!ongId) {
        setLoading(false);
        return;
      }
      try {
        const response = await api.get(`/proofs/activities/ong/${ongId}`);
        setActivities(response.data);
      } catch (error) {
        console.error("Erro ao carregar o catálogo de atividades:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();
  }, [ongId]);

  return (
    <ContentWrapper title="Ajuda & FAQ - Selo Cidadania">
      <div className={styles.container}>
        
        <h2 className={styles.sectionTitle}>Sobre o Programa</h2>
        
        <h3 className={styles.question}>O que é o Programa Selo Cidadania?</h3>
        <p className={styles.answer}>
          É uma tecnologia social idealizada e implementada há mais de 30 anos pela equipa da Rede Papel Solidário, 
          tendo sido premiada pela Ashoka no Brasil no final dos anos 90 e estudada e reconhecida pela Universidade 
          de Coimbra como a Primeira Moeda de Troca da América Latina.
        </p>

        <h3 className={styles.question}>Onde está sendo implementada?</h3>
        <p className={styles.answer}>
          O programa atua através da plataforma digital da Rede Papel Solidário, expandindo-se em parceria com 
          diversas Organizações da Sociedade Civil (OSCs) e instituições locais para levar este impacto a várias comunidades.
        </p>

        <h3 className={styles.question}>Como funciona?</h3>
        <p className={styles.answer}>
          O Selo Cidadania reconhece e valoriza boas ações da comunidade. Cada vez que você participa de atividades 
          cadastradas pela sua instituição, ajuda o próximo, aprende algo novo ou cuida do desenvolvimento educacional 
          e de saúde de seus filhos, você ganha "selos de cidadania". Estes selos funcionam como pontos que podem ser 
          trocados por alimentos, roupas, brinquedos, cursos e outros produtos na instituição parceira.
        </p>

        <h3 className={styles.question}>Por que o programa foi criado?</h3>
        <p className={styles.answer}>
          Para promover o engajamento social, incentivar a educação, os cuidados com a saúde e a melhoria de vida nas 
          comunidades, trocando o conceito de "assistencialismo passivo" por um modelo onde as famílias são reconhecidas 
          pelo seu esforço e participação ativa.
        </p>

        <br /><br />
        <h2 className={styles.sectionTitle}>Os Selos e as Trocas</h2>

        <h3 className={styles.question}>Como posso ganhar selos? (Catálogo da sua OSC)</h3>
        <p className={styles.answer}>
          Abaixo encontra a lista oficial de atividades configuradas pela sua instituição. Cumpra estas ações e submeta as 
          suas provas no sistema para acumular selos.
        </p>

        <div className={styles.tableWrapper}>
          <table className={styles.activitiesTable}>
            <thead>
              <tr>
                <th>Ação / Atividade</th>
                <th style={{ textAlign: 'center' }}>Selos Ganhos</th>
                <th>Forma de Validação</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="3" className={styles.emptyMessage}>A carregar atividades da instituição...</td>
                </tr>
              ) : activities.length > 0 ? (
                activities.map(activity => (
                  <tr key={activity.id}>
                    <td><strong>{activity.description}</strong></td>
                    <td style={{ textAlign: 'center' }}>
                      <span className={styles.badge}>{activity.seal_value}</span>
                    </td>
                    <td>
                      {activity.is_automatic 
                        ? 'Automática (Aprovada Instantaneamente)' 
                        : (activity.validation_method || 'Envio de Foto / Análise da OSC')}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="3" className={styles.emptyMessage}>
                    A sua instituição ainda não cadastrou nenhuma atividade no catálogo.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

      </div>
    </ContentWrapper>
  );
};

export default HelpPage;