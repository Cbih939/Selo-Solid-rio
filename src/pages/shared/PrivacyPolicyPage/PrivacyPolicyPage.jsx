// Arquivo: pages/shared/PrivacyPolicyPage/PrivacyPolicyPage.jsx

import React from 'react';
import ContentWrapper from '../../../components/ui/ContentWrapper/ContentWrapper';
import styles from './LegalPage.module.css'; // Usaremos um CSS compartilhado

const PrivacyPolicyPage = () => {
  return (
    <ContentWrapper title="Política de Privacidade">
      <div className={styles.legalContainer}>
        <p><strong>Última atualização:</strong> 14 de novembro de 2025</p>

        <h2 className={styles.sectionTitle}>1. Introdução</h2>
        <p>
          Bem-vindo(a) ao Programa Selo Cidadania. Esta plataforma digital, operada em parceria com o Instituto Energizando Vidas, leva a sua privacidade a sério. Esta Política de Privacidade descreve como coletamos, usamos, armazenamos e protegemos suas informações pessoais de acordo com a Lei Geral de Proteção de Dados (LGPD).
        </p>

        <h2 className={styles.sectionTitle}>2. Quais dados coletamos?</h2>
        <p>Para participar do programa, coletamos os seguintes dados dos beneficiários (titulares e dependentes):</p>
        <ul>
          <li><strong>Dados de Identificação:</strong> Nome completo, CPF, RG, data de nascimento.</li>
          <li><strong>Dados de Contato:</strong> Endereço residencial, e-mail, número de telefone.</li>
          <li><strong>Dados de Participação (Provas Sociais):</strong> Fotos, vídeos e documentos que você envia para comprovar a realização de atividades (ex: declaração de matrícula escolar, comprovante de vacinação, fotos em eventos).</li>
          <li><strong>Dados Sensíveis:</strong> Podemos coletar dados de saúde (ex: carteira de vacinação, atestado de pré-natal) e dados de menores de idade (seus dependentes), estritamente para a finalidade de validação das ações do programa.</li>
        </ul>

        <h2 className={styles.sectionTitle}>3. Como usamos seus dados?</h2>
        <p>Usamos suas informações exclusivamente para os seguintes propósitos:</p>
        <ul>
          <li>Gerenciar seu cadastro e participação no Programa Selo Cidadania.</li>
          <li>Validar as "Provas Sociais" enviadas por você para a concessão de selos.</li>
          <li>Administrar seu saldo de selos e os resgates no Shopping da Cidadania.</li>
          <li>Comunicar sobre eventos, novas atividades e o status da sua conta.</li>
          <li>Gerar relatórios estatísticos anônimos para medir o impacto do programa.</li>
        </ul>

        <h2 className={styles.sectionTitle}>4. Com quem compartilhamos seus dados?</h2>
        <p>Seus dados são tratados com confidencialidade e compartilhados apenas quando necessário:</p>
        <ul>
          <li><strong>Instituto Energizando Vidas:</strong> A equipe da ONG parceira tem acesso aos dados para realizar a validação das suas ações, aprovar selos e gerenciar o programa localmente.</li>
          <li><strong>Rede Papel Solidário:</strong> Como operadora da plataforma digital.</li>
          <li><strong>Obrigação Legal:</strong> Se formos obrigados por lei ou ordem judicial a fornecer informações.</li>
        </ul>
        <p>Nunca venderemos suas informações pessoais ou as compartilharemos com terceiros para fins de marketing.</p>

        <h2 className={styles.sectionTitle}>5. Seus Direitos (LGPD)</h2>
        <p>Você, como titular dos dados, tem o direito de:</p>
        <ul>
          <li><strong>Acesso:</strong> Solicitar uma cópia dos dados que temos sobre você.</li>
          <li><strong>Correção:</strong> Solicitar a correção de dados incompletos, inexatos ou desatualizados.</li>
          <li><strong>Exclusão:</strong> Solicitar a exclusão dos seus dados, o que pode implicar no encerramento da sua participação no programa.</li>
        </ul>
        <p>Para exercer seus direitos, entre em contato conosco.</p>

        <h2 className={styles.sectionTitle}>6. Contato</h2>
        <p>
          Se você tiver qualquer dúvida sobre esta política ou sobre seus dados, por favor, entre em contato com o Instituto Energizando Vidas:
          <br />
          <strong>E-mail:</strong> contato@energizandovidas.org.br
          <br />
          <strong>Telefone:</strong> 11 93707-8780
        </p>
      </div>
    </ContentWrapper>
  );
};

export default PrivacyPolicyPage;