import mitt from "mitt";

// 🎯 Definición de tipos para los eventos de la aplicación
export type EventMap = {
  // Eventos de autenticación
  "auth:openAccountDrawer": void;
  "auth:closeAccountDrawer": void;
  
  // Eventos de UI - Mobile Sidebar
  "ui:toggleMobileSidebar": void;
  "ui:closeMobileSidebar": void;
  
  // Eventos de Cart
  "cart:openCartDrawer": void;
  "cart:closeCartDrawer": void;
  
  // Eventos de Search
  "search:openDrawer": void;
  "search:closeDrawer": void;
  "search:closeIfOpen": void;
};

// 🚀 Instancia global del event bus
export const eventBus = mitt<EventMap>();

// 🎪 Funciones helper para eventos de autenticación
export const authEvents = {
  openAccountDrawer: () => eventBus.emit("auth:openAccountDrawer"),
  closeAccountDrawer: () => eventBus.emit("auth:closeAccountDrawer"),
};

// 🎪 Funciones helper para eventos de UI
export const uiEvents = {
  toggleMobileSidebar: () => eventBus.emit("ui:toggleMobileSidebar"),
  closeMobileSidebar: () => eventBus.emit("ui:closeMobileSidebar"),
};

// 🛒 Funciones helper para eventos de Cart
export const cartEvents = {
  openCartDrawer: () => eventBus.emit("cart:openCartDrawer"),
  closeCartDrawer: () => eventBus.emit("cart:closeCartDrawer"),
};

// 🔍 Funciones helper para eventos de Search
export const searchEvents = {
  openDrawer: () => eventBus.emit("search:openDrawer"),
  closeDrawer: () => eventBus.emit("search:closeDrawer"),
  closeIfOpen: () => eventBus.emit("search:closeIfOpen"),
};

// 📤 Exportar el eventBus para uso directo cuando sea necesario
export default eventBus;
