import Image from 'next/image';

const StoreGuarantees = () => {
  return (
    <section className="flex flex-col gap-6 items-center md:flex-row md:justify-around py-6">
      <div className="flex flex-col items-center text-center max-w-xs md:flex-row md:text-left">
        <Image
          src="/icons/truck.svg"
          alt="Envíos a todo el país"
          width={48}
          height={48}
          className="w-12 h-12 mb-3 md:mb-0 md:mr-3"
        />
        <div className="font-medium text-lg md:text-xl text-black">Envíos a todo el país</div>
      </div>
      <div className="flex flex-col items-center text-center max-w-xs md:flex-row md:text-left">
        <Image
          src="/icons/shield-check.svg"
          alt="Sitio Seguro"
          width={48}
          height={48}
          className="w-12 h-12 mb-3 md:mb-0 md:mr-3"
        />
        <div className="font-medium text-lg md:text-xl text-black">Sitio Seguro</div>
      </div>
      <div className="flex flex-col items-center text-center max-w-xs md:flex-row md:text-left">
        <Image
          src="/icons/package.svg"
          alt="Stock disponible"
          width={48}
          height={48}
          className="w-12 h-12 mb-3 md:mb-0 md:mr-3"
        />
        <div className="font-medium text-lg md:text-xl text-black">Stock disponible</div>
      </div>
    </section>
  );
};

export default StoreGuarantees;
