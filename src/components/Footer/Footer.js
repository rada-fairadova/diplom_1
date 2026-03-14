import React, { useState } from 'react';
import './Footer.css';

import { 
  FaPhone, 
  FaEnvelope, 
  FaTelegram, 
  FaMapMarkerAlt,
  FaYoutube,
  FaLinkedin,
  FaGoogle,
  FaFacebook,
  FaTwitter,
  FaUserCircle
} from 'react-icons/fa';

function Footer() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [emailError, setEmailError] = useState('');

  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!email.trim()) {
      setEmailError('Введите email');
      return;
    }

    if (!validateEmail(email)) {
      setEmailError('Введите корректный email');
      return;
    }

    // Здесь обычно отправка на сервер
    console.log('Subscribing email:', email);
    setSubscribed(true);
    setEmail('');
    setEmailError('');
    
    setTimeout(() => {
      setSubscribed(false);
    }, 3000);
  };

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    if (emailError) setEmailError('');
  };

  const socialLinks = [
    { name: 'YouTube', icon: <svg width="20" height="20" viewBox="0 0 38 30" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M18.5241 0C22.8289 0.174864 26.7823 0.324748 30.7231 0.512103C31.5138 0.549573 32.317 0.661986 33.1077 0.81187C35.2036 1.19907 36.672 2.62296 36.9983 4.78379C37.287 6.74477 37.4501 8.74321 37.5631 10.7417C37.7764 14.2889 37.7137 17.8237 37.4627 21.3709C37.3623 22.8323 37.1991 24.2936 36.923 25.73C36.5214 27.7909 35.0028 29.2148 32.8943 29.4272C30.2713 29.7019 27.6483 29.9393 25.0127 29.9767C20.0302 30.0392 15.0351 29.9642 10.0526 29.8893C8.44616 29.8643 6.82716 29.7019 5.22071 29.5146C2.45963 29.1774 0.966132 27.691 0.57707 24.9307C-0.0127984 20.7089 -0.0881007 16.4622 0.0750543 12.2155C0.162907 9.89232 0.363713 7.58162 0.58962 5.25842C0.765326 3.43483 1.6062 1.94849 3.35071 1.21156C4.20413 0.849341 5.15796 0.661986 6.08669 0.612025C10.3538 0.362219 14.6084 0.187355 18.5241 0ZM15.1104 21.5833C18.8755 19.4224 22.5904 17.2866 26.3807 15.1008C22.5779 12.915 18.863 10.7791 15.1104 8.6308C15.1104 12.9774 15.1104 17.2491 15.1104 21.5833Z" fill="#E5E5E5"/>
</svg>, url: 'https://youtube.com' },
    { name: 'LinkedIn', icon: "in", url: 'https://linkedin.com' },
    { name: 'Google-plus', icon: <svg width="20" height="20" viewBox="0 0 47 30" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M24.7257 3.93531C23.6153 5.11978 22.5789 6.15618 21.5425 7.19259C14.3617 3.56517 8.21726 5.11978 5.7743 11.2642C3.55343 16.5203 6.36653 22.5906 11.8447 24.4414C17.5449 26.3661 23.1711 23.1088 24.8738 16.6683C23.1711 16.6683 21.6165 16.6683 19.9879 16.6683C18.4333 16.6683 16.8787 16.6683 15.176 16.6683C15.176 14.9656 15.176 13.4851 15.176 11.7824C15.6942 11.7084 16.1384 11.7084 16.5825 11.7084C20.8022 11.7084 25.0959 11.7084 29.2415 11.7084C31.5364 17.4826 28.1311 25.1076 21.9126 28.2909C15.102 31.8443 6.88473 29.6974 2.51702 23.3309C-1.70264 17.0385 -0.518171 8.45109 5.33012 3.56517C11.1044 -1.32075 19.4697 -1.17269 24.7257 3.93531Z" fill="#E5E5E5"/>
<path d="M38.4951 15.0397C36.5703 15.0397 35.1638 15.0397 33.5352 15.0397C33.5352 13.9292 33.5352 12.9669 33.5352 11.7824C35.0157 11.7824 36.4963 11.7824 38.199 11.7824C38.199 10.0797 38.199 8.59915 38.199 6.89648C39.4575 6.89648 40.4199 6.89648 41.6043 6.89648C41.6043 8.37707 41.6043 9.85765 41.6043 11.5603C43.381 11.6343 44.9356 11.7084 46.5643 11.7824C46.5643 12.8188 46.5643 13.7072 46.5643 14.8916C45.0837 14.8916 43.5291 14.8916 41.7524 14.8916C41.7524 16.6683 41.7524 18.2229 41.7524 19.8516C40.5679 19.8516 39.6796 19.8516 38.4951 19.8516C38.4951 18.445 38.4951 16.8904 38.4951 15.0397Z" fill="#E5E5E5"/>
</svg>, url: 'https://plus.google.com' },
    { name: 'FaceBook', icon: <svg width="20" height="20" viewBox="0 0 14 30" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M8.97738 15.0287C8.97738 20.0416 8.97738 25.0006 8.97738 30C7.29748 30 5.67134 30 3.99144 30C3.99144 25.0275 3.99144 20.055 3.99144 15.0422C2.63408 15.0422 1.34392 15.0422 0 15.0422C0 13.3488 0 11.7093 0 10.0294C1.31704 10.0294 2.6072 10.0294 3.978 10.0294C3.978 9.43804 3.95112 8.88703 3.978 8.33603C4.0452 7.1265 3.99144 5.90353 4.24678 4.73432C4.98594 1.30733 7.56626 -0.412888 11.0739 0.0843625C11.9071 0.205315 12.7269 0.500977 13.5333 0.742883C13.8558 0.836957 13.9768 1.06542 13.9768 1.42828C13.9499 2.59749 13.9633 3.7667 13.9633 5.01655C13.3989 5.01655 12.8882 5.01655 12.3775 5.01655C11.9743 5.01655 11.5711 5.04342 11.168 5.05686C9.51495 5.15094 8.96394 5.71538 8.96394 7.38184C8.96394 8.24195 8.96394 9.08862 8.96394 10.0025C10.6438 10.0025 12.2834 10.0025 13.9633 10.0025C13.6408 11.6421 13.3317 13.2145 12.9957 14.7868C12.9688 14.8944 12.7269 15.0153 12.5925 15.0153C11.5846 15.0287 10.5766 15.0287 9.5687 15.0287C9.39399 15.0287 9.20585 15.0287 8.97738 15.0287Z" fill="#E5E5E5"/>
</svg>, url: 'https://facebook.com' },
    { name: 'Twitter', icon: <svg width="20" height="20" viewBox="0 0 37 30" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M0 26.603C3.8403 26.9989 7.36387 26.1279 10.541 23.9306C10.7093 23.8118 10.8775 23.6831 11.1151 23.505C7.64101 23.1883 5.34475 21.4364 4.05805 18.1998C5.20618 18.3978 6.27513 18.378 7.38367 18.1009C3.64235 16.9626 1.65291 14.4981 1.39557 10.5489C2.49422 11.0933 3.54337 11.4496 4.73109 11.4793C1.40547 8.67826 0.663145 5.35264 2.47442 1.35398C6.61165 6.22364 11.7782 8.86632 18.1128 9.31171C18.0633 8.9554 18.0039 8.64857 17.9742 8.33184C17.608 4.11543 20.5278 0.492882 24.7244 0.047487C27.0504 -0.199955 29.0992 0.522576 30.7917 2.14579C30.9896 2.33385 31.1579 2.37344 31.4053 2.31406C32.9296 1.95774 34.3746 1.40347 35.7702 0.651245C35.2357 2.35365 34.1767 3.65024 32.7316 4.71919C33.177 4.64001 33.6323 4.57073 34.0777 4.47175C34.5429 4.36287 35.0081 4.2342 35.4733 4.08574C35.9187 3.94717 36.3443 3.76901 36.8491 3.59086C35.9286 4.96663 34.8695 6.11476 33.6125 7.06494C33.2166 7.36187 33.1176 7.6687 33.1077 8.14379C32.989 15.7551 29.9504 21.9016 23.7346 26.3654C20.8346 28.4538 17.5288 29.5327 13.9755 29.8791C9.02668 30.374 4.41436 29.3545 0.178158 26.7316C0.12867 26.7019 0.0692838 26.692 0.00989768 26.6821C0 26.6524 0 26.6228 0 26.603Z" fill="#E5E5E5"/>
</svg>, url: 'https://twitter.com' }
  ];

  const contactInfo = [
    { icon: <FaPhone />, text: '8 (800) 000 00 00' },
    { icon: <FaEnvelope />, text: 'inbox@mail.ru' },
    { icon: <FaTelegram />, text: 'tu.train.tickets' },
    { icon: <FaMapMarkerAlt />, text: 'г. Москва, ул. Московская 27-35, 555 555' },
  ];

  return (
    <footer className="footer">
      <div className="footer__container">
        <div className="footer__section">
          <h3 className="footer__title">Свяжитесь с нами</h3>
          <div className="footer__contacts">
            {contactInfo.map((contact, index) => (
              <div key={index} className="footer__contact-item">
                <span className="footer__contact-icon">{contact.icon}</span>
                <span className="footer__contact-text">{contact.text}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="footer__section">
          <h3 className="footer__title">Подписка</h3>
          <p className="footer__subtitle">Будьте в курсе событий</p>
          
          <form className="footer__subscription" onSubmit={handleSubmit}>
            <div className="footer__input-group">
              <input
                type="email"
                value={email}
                onChange={handleEmailChange}
                placeholder="Введите ваш email"
                className={`footer__input ${emailError ? 'footer__input--error' : ''}`}
                disabled={subscribed}
              />
              {emailError && <span className="footer__error">{emailError}</span>}
            </div>
            
            <button 
              type="submit" 
              className={`footer__button ${subscribed ? 'footer__button--success' : ''}`}
              disabled={subscribed}
            >
              {subscribed ? 'Подписан!' : 'Отправить'}
            </button>
          </form>
        </div>

        <div className="footer__section">
          <h3 className="footer__title">Подписывайтесь на нас</h3>
          <div className="footer__social">
            {socialLinks.map((social, index) => (
              <a
                key={index}
                href={social.url}
                target="_blank"
                rel="noopener noreferrer"
                className="footer__social-link"
                aria-label={social.name}
              >
                <span className="footer__social-icon">{social.icon}</span>
              </a>
            ))}
          </div>
        </div>
      </div>

      <div className="footer__bottom">
        <div className="footer__logo">
          <div className="footer__logo-text">ЛОГО</div>
          <span className="footer__copyright">© 2026 WEB</span>
        </div>
        <p className="footer__disclaimer">
          Все права защищены. Сервис покупки ж/д билетов онлайн.
        </p>
      </div>
    </footer>
  );
}

export default Footer;
