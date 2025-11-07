// Arquivo: pages/ong/HelpPage/HelpPage.jsx

import React from 'react';
import ContentWrapper from '../../../components/ui/ContentWrapper/ContentWrapper';
import styles from './HelpPage.module.css';

const HelpPage = () => {
  return (
    <ContentWrapper title="Ajuda & FAQ - Selo Cidadania">
      <div className={styles.faqContainer}>
        
        {/* ================================================================== */}
        {/* 1. SOBRE O PROGRAMA */}
        {/* ================================================================== */}
        <h2 className={styles.sectionTitle}>Sobre o Programa</h2>
        
        <div className={styles.faqItem}>
          <h3 className={styles.question}>O que é o Programa Selo Cidadania?</h3>
          <p>É uma tecnologia social idealizada e implementada a mais de 30 anos pela equipe da Rede Papel Solidario, tendo sido premiada pela Ashoka no Brasil, no final dos anos 90 e estuda e reconhecida pela Universidade de Coimbra como a Primeira Moeda de Troca da América Latina.</p>
        </div>
        
        <div className={styles.faqItem}>
          <h3 className={styles.question}>Onde está sendo implementada neste ano de 2025?</h3>
          <p>Está sendo implementada na cidade de São Paulo, através da plataforma digital da Rede Papel Solidario em parceria com o Instituto Energizando Vidas.</p>
        </div>
        
        <div className={styles.faqItem}>
          <h3 className={styles.question}>Como funciona?</h3>
          <p>O Selo Cidadania reconhece e valoriza boas ações da comunidade. Cada vez que você participa de atividades, ajuda o próximo, aprende algo novo ou cuida do seu bairro, da sua casa ou acompanha o desenvolvimento educacional e de saúde de seus filhos, você ganha selos de cidadania, que podem ser trocados por alimentos, roupas, brinquedos, utensílios domésticos, cursos e outros produtos no Shopping da Cidadania.</p>
        </div>
        
        <div className={styles.faqItem}>
          <h3 className={styles.question}>Por que o programa foi criado?</h3>
          <p>Porque acreditamos que toda boa ação merece ser reconhecida. O Selo Cidadania nasceu para fortalecer o sentimento de solidariedade e ajudar famílias a crescerem com dignidade, aprendizado e oportunidades.</p>
        </div>
        
        <div className={styles.faqItem}>
          <h3 className={styles.question}>Preciso pagar algo para participar?</h3>
          <p>Não. A participação é totalmente gratuita. O programa é mantido por empresas e pessoas parceiras que acreditam na força da cidadania.</p>
        </div>

        {/* ================================================================== */}
        {/* 2. PARTICIPAÇÃO DAS FAMÍLIAS */}
        {/* ================================================================== */}
        <h2 className={styles.sectionTitle}>Participação das Famílias</h2>
        
        <div className={styles.faqItem}>
          <h3 className={styles.question}>Quem pode participar?</h3>
          <p>Famílias em situação de vulnerabilidade social que estejam cadastradas no Instituto Energizando Vidas.</p>
        </div>

        <div className={styles.faqItem}>
          <h3 className={styles.question}>Como faço o cadastro?</h3>
          <p>Você deve procurar a equipe do Instituto Energizando Vidas. Sede do Instituto Energizando Vidas na Avenida Leblon 272 – bairro Jardim dos Lagos e CEP 04771-050, na zona sul da cidade de São Paulo.</p>
        </div>

        <div className={styles.faqItem}>
          <h3 className={styles.question}>Qual procedimento para o cadastro?</h3>
          <p>Você será agendado para uma capacitação com duração aproximada de 3 horas com equipe do Instituto Energizando Vidas, e será necessário autorizar seu cadastro na Plataforma Digital do Programa Selo Cidadania, de seus dados, endereço, número de familiares que fazem parte de seu Núcleo Familiar.</p>
        </div>

        <div className={styles.faqItem}>
          <h3 className={styles.question}>O que preciso levar no dia da capacitação e cadastro?</h3>
          <ul>
            <li>Documento de identidade (RG ou CPF)</li>
            <li>Comprovante de endereço</li>
            <li>Cadastro Único (se tiver)</li>
            <li>Nome dos membros da família que moram com você</li>
          </ul>
        </div>

        <div className={styles.faqItem}>
          <h3 className={styles.question}>Posso indicar alguém da minha família para participar?</h3>
          <p>Sim. Um membro adulto será o titular do cadastro, e poderá incluir os demais integrantes.</p>
        </div>

        <div className={styles.faqItem}>
          <h3 className={styles.question}>Em qual endereço devo me dirigir para o cadastro e capacitação?</h3>
          <p>Na Sede do Instituto Energizando Vidas na Avenida Leblon 272 – bairro Jardim dos Lagos e CEP 04771-050, na zona sul da cidade de São Paulo.</p>
        </div>

        <div className={styles.faqItem}>
          <h3 className={styles.question}>Qual horário do funcionamento do Instituto Energizando Vidas?</h3>
          <p>Das 9 às 16 horas de segunda a sexta feira.</p>
        </div>

        <div className={styles.faqItem}>
          <h3 className={styles.question}>Como posso entrar em contato por telefone com a equipe do Instituto Energizando Vidas?</h3>
          <p>
            Telefone: (11) 93707-8780<br />
            E-mail: contato@energizandovidas.org.br
          </p>
        </div>

        {/* ================================================================== */}
        {/* 3. OS SELOS E AS TROCAS */}
        {/* ================================================================== */}
        <h2 className={styles.sectionTitle}>Os Selos e as Trocas</h2>

        <div className={styles.faqItem}>
          <h3 className={styles.question}>Como posso ganhar selos? (Ações que valem Selos)</h3>
          <div className={styles.tableContainer}>
            <table className={styles.faqTable}>
              <thead>
                <tr>
                  <th>Ação</th>
                  <th>Selos Conquistados</th>
                  <th>Forma de Validação</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Participação presencial da capacitação inicial no INSTITUTO ENERGIZANDO VIDAS</td>
                  <td>10</td>
                  <td>Assinatura na lista de presença</td>
                </tr>
                <tr>
                  <td>Realizar o login de acesso ao Programa Selo Cidadania</td>
                  <td>10</td>
                  <td>Acesso concedido</td>
                </tr>
                <tr>
                  <td>Demonstrar a matrícula ativa no ensino formal (por dependente, a cada semestre)</td>
                  <td>5</td>
                  <td>Foto da Declaração fornecida pela escola com data e assinatura em papel timbrado</td>
                </tr>
                <tr>
                  <td>Participar de reunião escolar (por dependente)</td>
                  <td>2</td>
                  <td>Foto do comprovante de comparecimento, em papel timbrado da escola, com data e assinatura</td>
                </tr>
                <tr>
                  <td>Demonstrar a carteira de vacinação atualizada (por dependente, a cada trimestre)</td>
                  <td>3</td>
                  <td>Foto da carteira de vacinação atualizada todo trimestre</td>
                </tr>
                <tr>
                  <td>Manter as consultas e exames regulares de pré-natal</td>
                  <td>3</td>
                  <td>Foto do Atestado médico de comparecimento na consulta ou exames, assinado e com carimbo do médico</td>
                </tr>
                <tr>
                  <td>Inscrição em cursos, e capacitações no formato presencial</td>
                  <td>3</td>
                  <td>Foto da ficha de inscrição</td>
                </tr>
                <tr>
                  <td>Participar de aulas, cursos, e capacitações</td>
                  <td>
                    <strong>3 selos</strong>
                    <p className={styles.tableNote}>(De acordo com a quantidade de horas: 10h, 20h, ou +30h)</p>
                  </td>
                  <td>Atestado de comparecimento em cada aula, assinado pelo responsável em papel timbrado</td>
                </tr>
                <tr>
                  <td>Participar de mutirão comunitário no bairro ou na escola</td>
                  <td>4</td>
                  <td>Foto da ação indicando sua presença e foto da declaração da instituição responsável</td>
                </tr>
                <tr>
                  <td>Participar de Projeto de Reciclagem ou horta comunitária</td>
                  <td>3</td>
                  <td>Foto da ação indicando sua presença e foto da declaração da instituição responsável</td>
                </tr>
                <tr>
                  <td>Participar de RODAS DE CONVERSA no INSTITUTO ENERGIZANDO VIDAS</td>
                  <td>5</td>
                  <td>Assinatura na lista de presença</td>
                </tr>
                <tr>
                  <td>Acompanhar familiar ou vizinho idoso em visita médica</td>
                  <td>3</td>
                  <td>Foto do Atestado de comparecimento assinado pelo médico</td>
                </tr>
                <tr>
                  <td>Levar os filhos para passeios externos (parques, cinema, etc.)</td>
                  <td>2</td>
                  <td>Foto do passeio demonstrando sua presença e dos filhos</td>
                </tr>
                <tr>
                  <td>Participar de ações de voluntariado na escola dos filhos</td>
                  <td>5</td>
                  <td>Foto da Declaração de sua participação assinada pela escola, em papel timbrado</td>
                </tr>
                <tr>
                  <td>Acompanhar filho para atendimento de saúde (psicólogo, assistente social, etc.)</td>
                  <td>
                    <strong>3 selos</strong>
                    <p className={styles.tableNote}>(Para acompanhamentos pontuais ou regulares)</p>
                  </td>
                  <td>Foto da declaração do profissional assinada em papel timbrado</td>
                </tr>
                <tr>
                  <td>Realizar comemoração de aniversário dos filhos</td>
                  <td>3</td>
                  <td>Foto da comemoração com o filho que demonstre sua presença</td>
                </tr>
                <tr>
                  <td>Presente Dia das Mães</td>
                  <td>10</td>
                  <td>Sem necessidade de comprovação. O sistema atualiza automaticamente.</td>
                </tr>
                <tr>
                  <td>Presente Aniversário</td>
                  <td>10</td>
                  <td>Sem necessidade de comprovação. O sistema atualiza automaticamente.</td>
                </tr>
                <tr>
                  <td>Presente Dia das Crianças</td>
                  <td>20</td>
                  <td>Sem necessidade de comprovação. O sistema atualiza automaticamente.</td>
                </tr>
                <tr>
                  <td>Presente de Natal (0 a 17 anos e 11 meses)</td>
                  <td>20</td>
                  <td>Lista de presença assinada no dia do Shopping de Natal</td>
                </tr>
                <tr>
                  <td>Presente de Natal (a partir de 18 anos)</td>
                  <td>10</td>
                  <td>Lista de presença assinada no dia do Shopping de Natal</td>
                </tr>
                <tr>
                  <td>Participar de ações voluntárias do INSTITUTO ENERGIZANDO VIDAS</td>
                  <td>5</td>
                  <td>Lista de presença</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className={styles.faqItem}>
          <h3 className={styles.question}>Como funciona a Validação das Ações?</h3>
          <p>O INSTITUTO ENERGIZANDO VIDAS, faz a validação de seus selos com base nas evidências que você apresentou no sistema do Programa Selo Cidadania, mediante (comprovantes, fotos, listas de presença etc.). Essas informações são registradas no sistema, com segurança e privacidade por você. O processo é simples e rápido.</p>
        </div>

        <div className={styles.faqItem}>
          <h3 className={styles.question}>Poupança solidária</h3>
          <p>Você pode acumular seus selos e decidir em qual mês deseja utilizá-los. Não precisa gastar tudo de uma vez. Poupar também é um ato de inteligência e estratégia. O sistema atualiza o ganho da poupança no dia de cada Shopping.</p>
        </div>

        <div className={styles.faqItem}>
          <h3 className={styles.question}>Como tenho acesso ao saldo de minha conta?</h3>
          <p>Você poderá acessar sua conta com seu login e senha. Tudo pode ser acompanhado pelo seu celular, de forma simples e segura. O sistema traz o saldo automático da sua conta. Tudo fácil e prático e você faz direto de seu celular.</p>
        </div>

        {/* ================================================================== */}
        {/* 4. O SHOPPING DA CIDADANIA */}
        {/* ================================================================== */}
        <h2 className={styles.sectionTitle}>O Shopping da Cidadania</h2>

        <div className={styles.faqItem}>
          <h3 className={styles.question}>O que é o Shopping da Cidadania?</h3>
          <p>É o local onde as famílias podem trocar seus selos por produtos, roupas, brinquedos e alimentos. Funciona uma vez por mês ou conforme o cronograma especial do Instituto Energizando Vidas.</p>
        </div>

        <div className={styles.faqItem}>
          <h3 className={styles.question}>Onde acontece o Shopping da Cidadania?</h3>
          <p>Normalmente no espaço da Sede do Instituto Energizando Vidas, ou em locais parceiros. A equipe do Instituto Energizando Vidas sempre avisa com antecedência a data e o endereço, em suas redes sociais. Fique atenta.</p>
        </div>

        <div className={styles.faqItem}>
          <h3 className={styles.question}>Quando ocorre o Shopping da Cidadania?</h3>
          <p>Ocorre uma vez por mês, em data, horário e local, definidos pelo INSTITUTO ENERGIZANDO VIDAS.</p>
        </div>

        <div className={styles.faqItem}>
          <h3 className={styles.question}>Como faço para saber a data do próximo Shopping da Cidadania?</h3>
          <p>O Instituto Energizando Vidas fara antecipadamente o anúncio da data do próximo Shopping da Cidadania nas redes sociai, fique atenta.</p>
        </div>

        <div className={styles.faqItem}>
          <h3 className={styles.question}>Posso trocar meus selos por quais produtos?</h3>
          <p>Você poderá trocar seus selos por alimentos, roupas, calçados, material escolar, itens de higiene, capacitações e serviços, entre outros.</p>
        </div>

        <div className={styles.faqItem}>
          <h3 className={styles.question}>Quais as regras para troca dos selos?</h3>
          <p>Atenção às regras:</p>
          <ul>
            <li>Os selos são intransferíveis.</li>
            <li>Não é permitido emprestar ou juntar com outras famílias.</li>
            <li>Os itens disponíveis no dia do Shopping da Cidadania, são os que poderão ser escolhidos por você.</li>
            <li>Você poderá vir com até dois acompanhantes, mas o resgate dos produtos será feito apenas por você.</li>
          </ul>
        </div>

        <div className={styles.faqItem}>
          <h3 className={styles.question}>Como sei quantos selos eu tenho?</h3>
          <p>Você pode consultar seu saldo diretamente com seu login e senha de acesso a qualquer hora na plataforma digital do Programa Selo Cidadania.</p>
        </div>

        <div className={styles.faqItem}>
          <h3 className={styles.question}>Quantos selos preciso para trocar por produtos?</h3>
          <p>Cada produto no Shopping da Cidadania tem um valor em selos, que podem ser alterados de acordo com oferta e demanda. A tabela de troca ficará exposta no Dia do Shopping da Cidadania a cada mês, e nas etiquetas dos produtos e serviços oferecidos.</p>
        </div>

        <div className={styles.faqItem}>
          <h3 className={styles.question}>Os selos vencem?</h3>
          <p>Sim. Os selos devem ser utilizados no prazo de até 90 dias após o recebimento, ou, em casos especiais serão reconsiderados, com justificativa apresentada a equipe do Instituto Energizando Vidas.</p>
        </div>

        <div className={styles.faqItem}>
          <h3 className={styles.question}>Posso transferir meus selos para outra pessoa?</h3>
          <p>Não. Os selos são pessoais e ligados ao seu cadastro familiar.</p>
        </div>

        <div className={styles.faqItem}>
          <h3 className={styles.question}>Que tipo de produtos posso trocar?</h3>
          <ul>
            <li>Alimentos</li>
            <li>Roupas e calçados</li>
            <li>Produtos de higiene</li>
            <li>Itens escolares</li>
            <li>Cursos e oficinas especiais</li>
            <li>Brinquedos</li>
            <li>Eletrônicos</li>
            <li>Eletrodomésticos</li>
            <li>Entre outros itens novos e usados em bom estado de conservação.</li>
          </ul>
        </div>

        <div className={styles.faqItem}>
          <h3 className={styles.question}>O que acontece se eu faltar no dia da troca?</h3>
          <p>Você pode usar seus selos na próxima edição, desde que ainda estejam dentro do prazo de validade. Se isso acontecer, seus selos ficarão em poupança e o valor total de selos será atualizado automaticamente em sua conta.</p>
        </div>

        {/* ================================================================== */}
        {/* 5. DÚVIDAS E CONTATOS */}
        {/* ================================================================== */}
        <h2 className={styles.sectionTitle}>Dúvidas e Contatos</h2>

        <div className={styles.faqItem}>
          <h3 className={styles.question}>Posso participar de outros programas sociais ao mesmo tempo?</h3>
          <p>Sim. O Selo Cidadania é complementar a outros benefícios e não interfere no Bolsa Família, Auxílio Gás ou outros programas.</p>
        </div>

        <div className={styles.faqItem}>
          <h3 className={styles.question}>Como entro em contato?</h3>
          <p>Procure a equipe do Instituto Energizando Vidas.</p>
        </div>

      </div>
    </ContentWrapper>
  );
};

export default HelpPage;