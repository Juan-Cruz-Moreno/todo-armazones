import Image from "next/image";

const HowToOrder = () => {
  return (
    <section className="py-8 px-4 sm:px-6 lg:px-8 bg-[#111111] text-[#ffffff]">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-center gap-6 lg:gap-10">
        {/* Paso 1 */}
        <div className="flex flex-col lg:flex-row items-center gap-3 text-center lg:text-left">
          <Image
            src="/icons/chevron-right.svg"
            alt=""
            width={24}
            height={24}
            className="w-5 h-5 lg:w-6 lg:h-6"
          />
          <p className="text-base lg:text-lg font-medium leading-tight">
            1. Creá o ingresá a tu cuenta.
          </p>
        </div>

        {/* Paso 2 */}
        <div className="flex flex-col lg:flex-row items-center gap-3 text-center lg:text-left">
          <Image
            src="/icons/chevron-right.svg"
            alt=""
            width={24}
            height={24}
            className="w-5 h-5 lg:w-6 lg:h-6"
          />
          <p className="text-base lg:text-lg font-medium leading-tight">
            2. Elegí todos los productos y las cantidades.
          </p>
        </div>

        {/* Paso 3 */}
        <div className="flex flex-col lg:flex-row items-center gap-3 text-center lg:text-left">
          <Image
            src="/icons/chevron-right.svg"
            alt=""
            width={24}
            height={24}
            className="w-5 h-5 lg:w-6 lg:h-6"
          />
          <p className="text-base lg:text-lg font-medium leading-tight">
            3. Escogé el método de pago, los datos te llegarán por mail
          </p>
        </div>

        {/* Paso 4 */}
        <div className="flex flex-col lg:flex-row items-center gap-3 text-center lg:text-left">
          <Image
            src="/icons/chevron-right.svg"
            alt=""
            width={24}
            height={24}
            className="w-5 h-5 lg:w-6 lg:h-6"
          />
          <p className="text-base lg:text-lg font-medium leading-tight">
            4. Elegí método de envío y revisá que los datos estén ok
          </p>
        </div>

        {/* Paso 5 */}
        <div className="flex flex-col lg:flex-row items-center gap-3 text-center lg:text-left">
          <Image
            src="/icons/chevron-right.svg"
            alt=""
            width={24}
            height={24}
            className="w-5 h-5 lg:w-6 lg:h-6"
          />
          <p className="text-base lg:text-lg font-medium leading-tight">
            5. ¡Listo, tu pedido está hecho! Verificá tu mail.
          </p>
        </div>
      </div>
    </section>
  );
};

export default HowToOrder;
