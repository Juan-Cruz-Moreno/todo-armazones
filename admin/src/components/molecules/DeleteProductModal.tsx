import { Trash } from "lucide-react";
import React from "react";

const DeleteProductModal = () => (
  <>
    <button
      className="btn btn-error"
      onClick={() =>
        (
          document.getElementById(
            "delete_product_modal"
          ) as HTMLDialogElement | null
        )?.showModal()
      }
    >
      <Trash className="size-4" />
    </button>
    <dialog id="delete_product_modal" className="modal">
      <div className="modal-box">
        <form method="dialog">
          <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">
            ✕
          </button>
        </form>
        <h3 className="font-bold text-lg">¿Eliminar producto?</h3>
        <p className="py-4">
          ¿Estás seguro que deseas eliminar este producto? Esta acción no se
          puede deshacer.
        </p>
        <div className="modal-action">
          <form method="dialog" className="flex gap-2">
            <button className="btn">Cancelar</button>
            <button className="btn btn-error">Eliminar</button>
          </form>
        </div>
      </div>
    </dialog>
  </>
);

export default DeleteProductModal;
