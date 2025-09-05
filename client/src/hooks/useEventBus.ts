import { useEffect, useRef } from "react";
import { eventBus, EventMap } from "@/utils/eventBus";
import type { Handler } from "mitt";

/**
 * Hook para escuchar eventos del eventBus en componentes React
 * Se encarga automáticamente de limpiar los listeners cuando el componente se desmonta
 */
export const useEventListener = <T extends keyof EventMap>(
  eventName: T,
  handler: Handler<EventMap[T]>
) => {
  const handlerRef = useRef(handler);
  
  // Actualizar la referencia del handler cuando cambie
  useEffect(() => {
    handlerRef.current = handler;
  }, [handler]);

  useEffect(() => {
    const eventHandler = (data: EventMap[T]) => {
      handlerRef.current(data);
    };

    eventBus.on(eventName, eventHandler);
    
    return () => {
      eventBus.off(eventName, eventHandler);
    };
  }, [eventName]);
};

/**
 * Hook que proporciona funciones para emitir eventos
 */
export const useEventBusActions = () => {
  return {
    // Función genérica para cualquier evento
    emit: <T extends keyof EventMap>(event: T, data: EventMap[T]) => {
      eventBus.emit(event, data);
    },
    
    // Función para escuchar eventos (usar con useEffect)
    on: eventBus.on,
    off: eventBus.off,
  };
};
