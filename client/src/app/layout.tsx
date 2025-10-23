import "./globals.css";
import type { Metadata } from "next";
import ReduxProvider from "@/redux/ReduxProvider";
import MaintenanceGuard from "@/components/guards/MaintenanceGuard";
import LayoutContent from "@/components/layout/LayoutContent";
import MaintenanceView from "@/components/maintenance/MaintenanceView";
import type { Maintenance } from "@/interfaces/maintenance";

export const metadata: Metadata = {
  title: "Todo Armazones – Importadores Mayoristas de Insumos Opticos",
  description:
    "Pioneros en ofrecer productos de calidad y al mejor precio del mercado.",
  robots: {
    index: false,
    follow: false,
  },
};

async function fetchMaintenanceServer(): Promise<Maintenance | null> {
  // Use server-side fetch to the configured API URL. The API returns an object
  // shaped like { data: Maintenance } on success (client axios expects that).
  const base = process.env.NEXT_PUBLIC_API_URL ?? "";
  if (!base) return null;

  // Fallback maintenance object used when we decide to treat an unavailable
  // backend as "site in maintenance". This gives a friendly UI rather than
  // letting the site render broken client assets.
  const fallbackMaintenance: Maintenance = {
    active: true,
    image: 1,
    title: "Sistema en Mantenimiento",
    subtitle: "Estamos realizando tareas de mantenimiento. Vuelve en unos minutos.",
    updatedAt: new Date(),
  };

  // By default we will treat failure to contact the backend as maintenance.
  // If you prefer the previous behavior (render the app when the API is down),
  // set the environment variable TREAT_DOWN_AS_MAINTENANCE=false in your server.
  const treatDownAsMaintenance = process.env.TREAT_DOWN_AS_MAINTENANCE !== "false";

  try {
    const res = await fetch(`${base}/maintenance`, { cache: "no-store" });
    if (!res.ok) {
      return treatDownAsMaintenance ? fallbackMaintenance : null;
    }
    const json = await res.json();
    // support both { data: Maintenance } and bare Maintenance
    return (json?.data ?? json) as Maintenance;
  } catch {
    // If the request throws (network error, server down), decide by env var.
    return treatDownAsMaintenance ? fallbackMaintenance : null;
  }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Run server-side check for maintenance before mounting any client providers
  const maintenance = await fetchMaintenanceServer();

  // If the backend says maintenance is active, render the maintenance view server-side
  if (maintenance?.active) {
    return (
      <html lang="es">
        <body>
          <MaintenanceView maintenance={maintenance} />
        </body>
      </html>
    );
  }

  // Normal app render: mount client providers and guards
  return (
    <html lang="es">
      <body>
        {/* Navbar measures its height on the client (useLayoutEffect) and sets --navbar-height */}
        <ReduxProvider>
          <MaintenanceGuard>
            <LayoutContent>{children}</LayoutContent>
          </MaintenanceGuard>
        </ReduxProvider>
      </body>
    </html>
  );
}
