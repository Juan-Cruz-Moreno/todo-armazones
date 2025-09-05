import Image from "next/image";
import Link from "next/link";
import InstagramIcon from "../atoms/Icon/InstagramIcon";
import WhatsAppIcon from "../atoms/Icon/WhatsAppIcon";
import EmailIcon from "../atoms/Icon/EmailIcon";

const Footer = () => {
  return (
    <footer className="footer sm:footer-horizontal bg-white text-[#333] p-10">
      <aside>
        <Image
          src="/logo-todo-armazones.png"
          alt="Logo Todo Armazones"
          width={180}
          height={90}
          className="mb-4"
        />
        <p>
          Pioneros en ofrecer productos de calidad y al mejor precio del
          mercado.
        </p>
      </aside>
      <nav>
        <h6 className="footer-title opacity-100">LA EMPRESA</h6>
        <Link href="/quienes-somos" className="underline-animate">
          Quienes somos
        </Link>
        <Link href="/privacidad" className="underline-animate">
          Política de privacidad
        </Link>
        <Link href="/arrepentimiento" className="underline-animate">
          Botón de arrepentimiento
        </Link>
      </nav>
      <nav>
        <h6 className="footer-title opacity-100">TIENDA ONLINE</h6>
        <Link href="/contacto" className="underline-animate">
          Contacto
        </Link>
        <Link href="/devolucion" className="underline-animate">
          Política de devolución
        </Link>
        <Link href="/envios" className="underline-animate">
          Política de envíos
        </Link>
        <Link href="/medios-de-pago" className="underline-animate">
          Medios de pago
        </Link>
        <Link href="/faq" className="underline-animate">
          Preguntas frecuentes
        </Link>
      </nav>
      <nav>
        <h6 className="footer-title opacity-100">INFO</h6>
        <a
          href="mailto:info@todoarmazonesarg.com"
          target="_blank"
          rel="noopener noreferrer"
          className="link link-hover flex items-center gap-2"
        >
          <EmailIcon />
          info@todoarmazonesarg.com
        </a>
        <a
          href="https://instagram.com/todoarmazonesarg"
          target="_blank"
          rel="noopener noreferrer"
          className="link link-hover flex items-center gap-2"
        >
          <InstagramIcon />
          Instagram
        </a>
        <a
          href="https://wa.me/5491136448293"
          target="_blank"
          rel="noopener noreferrer"
          className="link link-hover flex items-center gap-2"
        >
          <WhatsAppIcon />
          WhatsApp
        </a>
      </nav>
    </footer>
  );
};

export default Footer;
