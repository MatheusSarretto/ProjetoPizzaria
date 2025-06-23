import React from 'react';
import './PrivacyPolicyModal.css';

function PrivacyPolicyModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-button" onClick={onClose}>
        </button>
        <h2>Política de Uso - Bom Noite Pizzaria</h2>
        
        <div className="modal-body-scrollable">
          <p>Política de Uso - Bom Noite Pizzaria Atualizado em: 03/06/2025. Quem somos Bom Noite Pizzaria é uma marca oficialmente licenciada e operada por José Geovane da Silva umburana me , devidamente registrada sob o CNPJ 12.345.678/0001-90. Nossa sede está localizada em rua barão de jaguara 1045, cambuci - sao paulo sob o contato bomnoitepizzaria@gmail.com. Somos responsáveis pela gestão e proteção dos dados pessoais coletados em nossa plataforma, usados para processar e entregar seus pedidos com base nos termos desta política de uso. 2. Coleta de dados Durante sua interação conosco, coletamos algumas informações para facilitar sua experiência e tornar o serviço mais eficiente. Isso inclui: Informações pessoais, como nome, endereço e telefone, necessárias para processar e entregar seus pedidos. Dados de pagamento, que são tratados com sistemas seguros para proteger suas informações. Dados de navegação, como preferências de consumo, que nos ajudam a personalizar ofertas e melhorar nossos serviços. Garantimos que todos os dados são protegidos e tratados de acordo com a legislação vigente, especialmente a Lei Geral de Proteção de Dados (LGPD). Usamos essas informações apenas para os fins descritos nesta política e nunca vendemos ou compartilhamos dados com terceiros sem sua autorização. 3. Uso responsável do serviço Nosso aplicativo e site foram projetados para facilitar seus pedidos e proporcionar conveniência. Para manter o bom funcionamento, pedimos que você: Informe dados corretos e atualizados ao realizar seu cadastro e pedidos. Utilize a plataforma de maneira ética, sem práticas fraudulentas ou atividades que possam prejudicar a experiência de outros usuários. Não compartilhe sua senha ou credenciais com terceiros. O uso inadequado da plataforma poderá levar à suspensão ou ao cancelamento de seu acesso. 4. Compromisso com a lei Estamos comprometidos em operar de forma alinhada às leis brasileiras, como o Código de Defesa do Consumidor e o Decreto 7.962/2013, que regulam as transações digitais e protegem seus direitos. Nosso objetivo é garantir que todos os pedidos sejam atendidos com transparência, respeito e qualidade. 5. Segurança e privacidade Proteger suas informações é uma prioridade. Implementamos medidas de segurança robustas para garantir que seus dados estejam sempre protegidos. Caso surja alguma dúvida ou preocupação sobre privacidade, nossa equipe está à disposição para ajudá-lo pelo e-mail fornecido acima. 6. Alterações na política Esta política pode ser revisada para refletir mudanças nos serviços ou atualizações legais. Qualquer modificação será comunicada de forma clara. Recomendamos que você consulte esta página regularmente para se manter atualizado. 7. Fale conosco Se tiver dúvidas, sugestões ou precisar de suporte, entre em contato pelo nosso email: bomnoitepizzaria@gmail.com. Agradecemos por confiar no Bom Noite Pizzaria. Conte conosco para tornar sua experiência de delivery sempre excelente!</p>
        </div>
      </div>
    </div>
  );
}

export default PrivacyPolicyModal;