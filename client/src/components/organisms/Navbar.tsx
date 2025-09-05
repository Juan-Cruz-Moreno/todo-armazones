"use client";

import Image from "next/image";
import Link from "next/link";
import CartDrawer from "./CartDrawer";
import SearchDrawer from "./SearchDrawer";
import AccountDrawer from "./AccountDrawer";

const Navbar = () => {
  return (
    <div className="navbar bg-white shadow-sm px-4 sm:px-6 md:px-8 lg:px-10 z-10 sticky top-0">
      <div className="flex-1 flex items-center gap-4">
        <Link href="/" className="flex-none">
          <Image
            src="/logo-todo-armazones.png"
            alt="Todo Armazones — ir al inicio"
            width={150}
            height={75}
            priority
          />
        </Link>
      </div>
      <div className="flex flex-row items-center gap-2 flex-none">
        <Link
          href="/catalogo"
          className="flex items-center gap-2 bg-white text-black cursor-pointer mr-3"
          aria-label="Ir al catálogo"
        >
          <span>Catálogo</span>
        </Link>
        <SearchDrawer />
        <CartDrawer />

        <AccountDrawer />
      </div>
    </div>
  );
};

export default Navbar;
