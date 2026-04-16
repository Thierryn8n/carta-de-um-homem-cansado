"use client"

import { useState } from "react"
import { X, MapPin, Navigation } from "lucide-react"
import { Button } from "@/components/ui/button"

interface MapModalProps {
  isOpen: boolean
  onClose: () => void
  geo: {
    latitude?: number
    longitude?: number
    city?: string
    region?: string
    country?: string
    street?: string
    neighborhood?: string
    zip?: string
  } | null
  ip: string
}

export function MapModal({ isOpen, onClose, geo, ip }: MapModalProps) {
  const [mapType, setMapType] = useState<"osm" | "satellite">("osm")
  
  if (!isOpen || !geo) return null

  const hasCoords = geo.latitude && geo.longitude
  
  // OpenStreetMap embed URL (gratuito)
  const osmUrl = hasCoords
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${geo.longitude! - 0.01},${geo.latitude! - 0.01},${geo.longitude! + 0.01},${geo.latitude! + 0.01}&layer=mapnik&marker=${geo.latitude},${geo.longitude}`
    : null

  // Google Maps URL (se tiver coords)
  const googleMapsUrl = hasCoords
    ? `https://www.google.com/maps?q=${geo.latitude},${geo.longitude}`
    : geo.city
    ? `https://www.google.com/maps/search/${encodeURIComponent(`${geo.street || ""} ${geo.neighborhood || ""} ${geo.city}`.trim())}`
    : null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-background rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">Localização do IP: {ip}</h2>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Address Info */}
        <div className="p-4 bg-muted/50 border-b">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            {geo.street && (
              <div>
                <span className="text-muted-foreground">Rua:</span>
                <p className="font-medium">{geo.street}</p>
              </div>
            )}
            {geo.neighborhood && (
              <div>
                <span className="text-muted-foreground">Bairro:</span>
                <p className="font-medium">{geo.neighborhood}</p>
              </div>
            )}
            {geo.city && (
              <div>
                <span className="text-muted-foreground">Cidade:</span>
                <p className="font-medium">{geo.city}</p>
              </div>
            )}
            {geo.zip && (
              <div>
                <span className="text-muted-foreground">CEP:</span>
                <p className="font-medium">{geo.zip}</p>
              </div>
            )}
            {geo.region && (
              <div>
                <span className="text-muted-foreground">Estado:</span>
                <p className="font-medium">{geo.region}</p>
              </div>
            )}
            {geo.country && (
              <div>
                <span className="text-muted-foreground">País:</span>
                <p className="font-medium">{geo.country}</p>
              </div>
            )}
            {geo.latitude && (
              <div>
                <span className="text-muted-foreground">Latitude:</span>
                <p className="font-medium">{geo.latitude.toFixed(6)}</p>
              </div>
            )}
            {geo.longitude && (
              <div>
                <span className="text-muted-foreground">Longitude:</span>
                <p className="font-medium">{geo.longitude.toFixed(6)}</p>
              </div>
            )}
          </div>
        </div>

        {/* Map */}
        <div className="flex-1 min-h-[400px] relative bg-muted">
          {hasCoords && osmUrl ? (
            <iframe
              src={osmUrl}
              width="100%"
              height="100%"
              style={{ border: 0, minHeight: "400px" }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Mapa de localização"
            />
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <div className="text-center">
                <MapPin className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Sem coordenadas exatas para este IP</p>
                <p className="text-sm mt-2">Mostrando apenas cidade aproximada</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t">
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setMapType("osm")}
              className={mapType === "osm" ? "bg-primary/10" : ""}
            >
              Mapa
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setMapType("satellite")}
              className={mapType === "satellite" ? "bg-primary/10" : ""}
            >
              Satélite
            </Button>
          </div>
          
          {googleMapsUrl && (
            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
            >
              <Navigation className="w-4 h-4" />
              Abrir no Google Maps
            </a>
          )}
        </div>
      </div>
    </div>
  )
}
