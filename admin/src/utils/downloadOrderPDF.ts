import axiosInstance from "@/utils/axiosInstance";
import { getErrorMessage } from "@/types/api";

/**
 * Descarga el PDF de una orden y dispara la descarga en el navegador.
 * @param orderId ID de la orden
 * @param firstName Nombre del usuario
 * @param lastName Apellido del usuario
 * @param orderNumber Número de la orden
 */
export async function downloadOrderPDF(
  orderId: string,
  firstName: string,
  lastName: string,
  orderNumber: number
) {
  try {
    const response = await axiosInstance.get(`/orders/${orderId}/pdf`, {
      responseType: "blob",
    });
    const blob = new Blob([response.data], { type: "application/pdf" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    const fileName = `${firstName}_${lastName}_${orderNumber}.pdf`;
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}
