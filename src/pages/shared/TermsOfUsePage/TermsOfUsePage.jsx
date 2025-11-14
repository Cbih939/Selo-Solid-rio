// Arquivo: pages/shared/TermsOfUsePage/TermsOfUsePage.jsx

import React from 'react';
import ContentWrapper from '../../../components/ui/ContentWrapper/ContentWrapper';
import styles from '../PrivacyPolicyPage/LegalPage.module.css'; // Reutilizando o mesmo CSS

const TermsOfUsePage = () => {
  return (
    <ContentWrapper title="Termos de Uso">
      <div className={styles.legalContainer}>
        <p><strong>Última atualização:</strong> 14 de novembro de 2025</p>

        <h2 className={styles.sectionTitle}>1. Aceitação dos Termos</h2>
        <p>Ao se cadastrar e utilizar a plataforma digital do Programa Selo Cidadania ("Plataforma"), você concorda em cumprir e aceitar estes Termos de Uso. Se você não concorda com estes termos, não deverá utilizar a plataforma.</p>

        <h2 className={styles.sectionTitle}>2. O Programa</h2>
        <p>O Selo Cidadania é uma tecnologia social que incentiva boas ações através de um sistema de "moeda social" (Selos). A participação é gratuita e voluntária, destinada a famílias cadastradas no Instituto Energizando Vidas.</p>

        <h2 className={styles.sectionTitle}>3. Regras de Participação e Uso</h2>
        <ul>
          <li><strong>Cadastro:</strong> Você concorda em fornecer informações verdadeiras, corretas e atualizadas no momento do seu cadastro e no de seus dependentes.</li>
          <li><strong>Provas Sociais:</strong> Ao enviar fotos, documentos ou outros comprovantes ("Provas Sociais") para validação, você declara que tem o direito de usar essas imagens e nos concede permissão para usá-las estritamente para os fins de validação do programa.</li>
          <li><strong>Uso Indevido:</strong> É estritamente proibido fraudar o sistema, enviar comprovantes falsos, tentar duplicar selos ou criar contas falsas.</li>
        </ul>

        <h2 className={styles.sectionTitle}>4. Regras dos Selos</h2>
        <ul>
          <li><strong>Intransferíveis:</strong> Os selos são pessoais e intransferíveis. Não é permitido vender, doar, emprestar ou juntar selos com outras famílias.</li>
          <li><strong>Validade:</strong> Os selos expiram em 90 (noventa) dias após serem concedidos, salvo exceções comunicadas pelo Instituto Energizando Vidas.</li>
          <li><strong>Não-monetário:</strong> Os selos não possuem valor monetário e não podem ser trocados por dinheiro (Real).</li>
        </ul>

        <h2 className={styles.sectionTitle}>5. O Shopping da Cidadania</h2>
        <p>O Shopping da Cidadania é um evento organizado pelo Instituto Energizando Vidas. As regras, datas, produtos disponíveis e os valores em selos são definidos pela organização do programa e podem mudar a cada evento.</p>

        <h2 className={styles.sectionTitle}>6. Limitação de Responsabilidade</h2>
        <p>A plataforma é fornecida "como está". Não garantimos que a plataforma estará livre de erros ou disponível ininterruptamente. A Rede Papel Solidário e o Instituto Energizando Vidas não se responsabilizam por perdas ou danos decorrentes do uso (ou da incapacidade de uso) da plataforma.</p>

        <h2 className={styles.sectionTitle}>7. Propriedade Intelectual</h2>
        <p>O nome "Selo Cidadania", o logotipo e a plataforma são de propriedade da Rede Papel Solidário. Você concorda em não usar estas marcas sem autorização prévia.</p>

        <h2 className={styles.sectionTitle}>8. Alterações nos Termos</h2>
        <p>Podemos atualizar estes Termos de Uso a qualquer momento. Notificaremos você sobre mudanças significativas. A continuação do uso da plataforma após as mudanças significa que você aceita os novos termos.</p>

        <h2 className={styles.sectionTitle}>9. Contato</h2>
        <p>Para dúvidas sobre estes termos, entre em contato com o Instituto Energizando Vidas.</p>
      </div>
    </ContentWrapper>
  );
};

export default TermsOfUsePage;