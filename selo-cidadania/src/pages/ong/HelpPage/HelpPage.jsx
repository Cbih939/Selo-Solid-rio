import React from 'react';
import ContentWrapper from '../../../components/ui/ContentWrapper/ContentWrapper';
import styles from './HelpPage.module.css';

const HelpPage = () => {
  return (
    <ContentWrapper title="Central de Ajuda">
      <div className={styles.section}>
        <h3>Como cadastro um usuário?</h3>
        <p>Vá para a página "Cadastrar Usuário", preencha os dados e clique em "Cadastrar". O usuário receberá um email para definir a sua senha.</p>
      </div>
      <div className={styles.section}>
        <h3>O que é a Tela de Aceite?</h3>
        <p>É onde você aprova ou rejeita as "provas sociais" enviadas pelos usuários. Ao aprovar, você concede selos a eles pela atividade realizada.</p>
      </div>
    </ContentWrapper>
  );
};

export default HelpPage;