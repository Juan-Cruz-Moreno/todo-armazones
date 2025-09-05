"use client";

import { Menu, X } from "lucide-react";
import { useState } from "react";
import { useEventListener } from "@/hooks/useEventBus";
import { uiEvents } from "@/utils/eventBus";

const MobileCategoriesButton = () => {
  const [isOpen, setIsOpen] = useState(false);

  // Escuchar eventos con los nuevos hooks
  useEventListener('ui:toggleMobileSidebar', () => {
    setIsOpen(prev => !prev);
  });

  useEventListener('ui:closeMobileSidebar', () => {
    setIsOpen(false);
  });

  const handleToggle = () => {
    uiEvents.toggleMobileSidebar();
  };

  return (
    <button
      onClick={handleToggle}
      className="inline-flex items-center gap-2 p-3 bg-white sm:hidden mb-4"
    >
      {isOpen ? (
        <X size={20} className="text-[#111111]" />
      ) : (
        <Menu size={20} className="text-[#111111]" />
      )}
      <span className="font-semibold text-[#111111]">CATEGORÍAS</span>
    </button>
  );
};

export default MobileCategoriesButton;
