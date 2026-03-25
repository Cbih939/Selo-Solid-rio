import React, { useState } from 'react';
import ContentWrapper from '../../../components/ui/ContentWrapper/ContentWrapper';
import styles from './HelpPage.module.css';

// Componente auxiliar para os itens do FAQ abrirem e fecharem (Acordeão)
const FaqItem = ({ question, children }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={`${styles.faqItem} ${isOpen ? styles.open : ''}`}>
      <button 
        className={styles.questionBtn} 
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        <span className={styles.questionText}>{question}</span>
        <span className={styles.icon}>{isOpen ? '−' : '+'}</span>
      </button>
      <div className={styles.answerWrapper} style={{ maxHeight: isOpen ? '1000px' : '0' }}>
        <div className={styles.answerContent}>
          {children}
        </div>
      </div>
    </div>
  );
};

const HelpPage = () => {
  return (
    <ContentWrapper title="Ajuda & FAQ - Selo Cidadania">
      <div className={styles.container}>
        
        <div className={styles.headerBox}>
          <div className={styles.headerIcon}>❓</div>
          <div>
            <h3>Perguntas Frequentes</h3>
            <p>Encontre aqui as respostas para as dúvidas mais comuns sobre o programa Selo Cidadania e saiba como aproveitar ao máximo as suas recompensas.</p>
          </div>
        </div>

        {/* ================================================================== */}
        {/* 1. SOBRE O PROGRAMA */}
        {/* ================================================================== */}
        <section className={styles.sectionBlock}>
          <h2 className={styles.sectionTitle}>Sobre o Programa</h2>
          
          <FaqItem question="O que é o Programa Selo Cidadania?">
            <p>É uma tecnologia social idealizada e implementada há mais de 30 anos pela equipa da Rede Papel Solidário, tendo sido premiada pela Ashoka no Brasil no final dos anos 90, e estudada e reconhecida pela Universidade de Coimbra como a Primeira Moeda de Troca da América Latina.</p>
          </FaqItem>
          
          <FaqItem question="Onde está sendo implementado neste ano de 2025?">
            <p>Está a ser implementado na cidade de São Paulo, através da plataforma digital da Rede Papel Solidário em parceria com as Organizações da Sociedade Civil (OSC) parceiras do programa Selo Cidadania.</p>
          </FaqItem>
          
          <FaqItem question="Como funciona?">
            <p>O Selo Cidadania reconhece e valoriza boas ações da comunidade. Cada vez que você participa em atividades, ajuda o próximo, aprende algo novo, cuida do seu bairro, da sua casa, ou acompanha o desenvolvimento educacional e de saúde dos seus filhos, você ganha selos de cidadania. Estes selos podem ser trocados por alimentos, roupas, brinquedos, utensílios domésticos, cursos e outros produtos no Shopping da Cidadania.</p>
          </FaqItem>
          
          <FaqItem question="Por que o programa foi criado?">
            <p>Porque acreditamos que toda a boa ação merece ser reconhecida. O Selo Cidadania nasceu para fortalecer o sentimento de solidariedade e ajudar famílias a crescerem com dignidade, aprendizado e oportunidades.</p>
          </FaqItem>
          
          <FaqItem question="Preciso pagar algo para participar?">
            <p>Não. A participação é totalmente gratuita. O programa é mantido por empresas e pessoas parceiras que acreditam na força da cidadania.</p>
          </FaqItem>
        </section>

        {/* ================================================================== */}
        {/* 2. PARTICIPAÇÃO DAS FAMÍLIAS */}
        {/* ================================================================== */}
        <section className={styles.sectionBlock}>
          <h2 className={styles.sectionTitle}>Participação das Famílias</h2>
          
          <FaqItem question="Quem pode participar?">
            <p>Famílias em situação de vulnerabilidade social que estejam cadastradas nas Organizações (OSCs) participantes do programa Selo Cidadania.</p>
          </FaqItem>

          <FaqItem question="Como faço o cadastro?">
            <p>Deve procurar a equipa da Organização (OSC) participante mais próxima da sua residência para iniciar o processo de vinculação.</p>
          </FaqItem>

          <FaqItem question="Qual o procedimento para o cadastro?">
            <p>Você será agendado para uma capacitação inicial (com duração aproximada de 3 horas) com a equipa da OSC. Será necessário autorizar o seu cadastro na Plataforma Digital do Programa Selo Cidadania, incluindo os seus dados, endereço e número de familiares que fazem parte do seu Núcleo Familiar.</p>
          </FaqItem>

          <FaqItem question="O que preciso levar no dia da capacitação e cadastro?">
            <ul className={styles.bulletList}>
              <li>Documento de identidade (RG ou CPF)</li>
              <li>Comprovante de endereço</li>
              <li>Cadastro Único (se tiver)</li>
              <li>Nome dos membros da família que moram consigo</li>
            </ul>
          </FaqItem>

          <FaqItem question="Posso indicar alguém da minha família para participar?">
            <p>Sim. Um membro adulto será o titular do cadastro, e poderá incluir os restantes integrantes como dependentes através do seu próprio painel (Menu: Meus Dependentes).</p>
          </FaqItem>
        </section>

        {/* ================================================================== */}
        {/* 3. OS SELOS E AS TROCAS */}
        {/* ================================================================== */}
        <section className={styles.sectionBlock}>
          <h2 className={styles.sectionTitle}>Os Selos e as Trocas</h2>

          <FaqItem question="Como posso ganhar selos? (Ações que valem Selos)">
            <p>Cada Organização possui o seu próprio <strong>Catálogo de Atividades</strong> (visível no menu "Enviar Prova Social"). Lá poderá consultar todas as ações que rendem selos, o seu respetivo valor e qual o comprovativo necessário.</p>
          </FaqItem>

          <FaqItem question="Como funciona a Validação das Ações?">
            <p>A sua OSC faz a validação dos seus selos com base nas evidências que você enviou pelo sistema (comprovantes, fotos, listas de presença, etc.). Essas informações são registadas com segurança e privacidade. O processo é simples e rápido.</p>
          </FaqItem>

          <FaqItem question="Poupança solidária">
            <p>Você pode acumular os seus selos e decidir em qual mês deseja utilizá-los. Não precisa de gastar tudo de uma vez. Poupar também é um ato de inteligência e estratégia.</p>
          </FaqItem>

          <FaqItem question="Como tenho acesso ao saldo da minha conta?">
            <p>Pode consultar a sua "Carteira Digital" no menu "Meu Saldo". Tudo pode ser acompanhado pelo telemóvel, de forma simples e segura, com o saldo a atualizar automaticamente após cada aprovação ou compra.</p>
          </FaqItem>
        </section>

        {/* ================================================================== */}
        {/* 4. O SHOPPING DA CIDADANIA */}
        {/* ================================================================== */}
        <section className={styles.sectionBlock}>
          <h2 className={styles.sectionTitle}>O Shopping da Cidadania</h2>

          <FaqItem question="O que é o Shopping da Cidadania?">
            <p>É o local (físico ou na plataforma) onde as famílias podem trocar os seus selos acumulados por produtos, roupas, brinquedos, alimentos, etc. Funciona conforme o cronograma especial da sua OSC.</p>
          </FaqItem>

          <FaqItem question="Quais as regras para troca dos selos?">
            <p><strong>Atenção às regras:</strong></p>
            <ul className={styles.bulletList}>
              <li>Os selos são intransferíveis.</li>
              <li>Não é permitido emprestar ou juntar o saldo com outras famílias.</li>
              <li>Os itens disponíveis são limitados ao stock existente no momento.</li>
            </ul>
          </FaqItem>

          <FaqItem question="Os selos vencem?">
            <p>Sim. Os selos devem ser utilizados no prazo de até 90 dias após o recebimento (salvo indicação em contrário da sua OSC), ou, em casos especiais, serão reconsiderados mediante justificação.</p>
          </FaqItem>
        </section>

        {/* ================================================================== */}
        {/* 5. DÚVIDAS E CONTATOS */}
        {/* ================================================================== */}
        <section className={styles.sectionBlock}>
          <h2 className={styles.sectionTitle}>Dúvidas e Contatos</h2>

          <FaqItem question="Posso participar de outros programas sociais ao mesmo tempo?">
            <p>Sim. O Selo Cidadania é complementar a outros benefícios e não interfere no Bolsa Família, Auxílio Gás ou outros programas governamentais.</p>
          </FaqItem>

          <FaqItem question="Como entro em contato com a organização do Selo Cidadania?">
            <div className={styles.contactCard}>
              <div className={styles.contactIcon}>✉️</div>
              <div>
                <strong>E-mail Oficial de Suporte:</strong><br/>
                <a href="mailto:contato@selocidadania.org.br" className={styles.contactLink}>
                  contato@selocidadania.org.br
                </a>
              </div>
            </div>
            <p className={styles.contactNote}>Para dúvidas relacionadas com a aprovação específica de uma prova social, deve contactar diretamente a equipa da OSC onde está vinculado.</p>
          </FaqItem>
        </section>

      </div>
    </ContentWrapper>
  );
};

export default HelpPage;