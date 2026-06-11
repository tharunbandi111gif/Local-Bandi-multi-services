import React, { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet-draw';

interface DrawControlProps {
  onCreated: (e: any) => void;
  onEdited?: (e: any) => void;
  onDeleted?: (e: any) => void;
  customZones?: any[];
  isBulkEditActive?: boolean;
  onBulkSave?: (updates: any[]) => void;
  onBulkDelete?: (deletedIds: string[]) => void;
}

export default function DrawControl({ 
  onCreated, 
  onEdited, 
  onDeleted,
  customZones = [],
  isBulkEditActive = false,
  onBulkSave,
  onBulkDelete
}: DrawControlProps) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    // Create a feature group to hold the drawn items, but don't add duplicates
    const drawnItems = new L.FeatureGroup();
    map.addLayer(drawnItems);

    // If bulk editing is active, populate the FeatureGroup with existing custom zones as interactive layers
    if (isBulkEditActive && customZones) {
      customZones.forEach(zone => {
        let layer: any;
        const options = {
          color: '#6366f1',
          fillColor: '#6366f1',
          fillOpacity: 0.25,
          weight: 3
        };
        if (zone.type === 'circle') {
          layer = L.circle(zone.center, { 
            ...options, 
            radius: zone.radius,
            color: '#f59e0b',
            fillColor: '#f59e0b'
          });
        } else if (zone.type === 'rectangle') {
          layer = L.rectangle(zone.bounds, {
            ...options,
            color: '#10b981',
            fillColor: '#10b981'
          });
        } else if (zone.type === 'polygon') {
          layer = L.polygon(zone.positions, options);
        }
        if (layer) {
          layer.zoneId = zone.id; // Store ID to match on edited/deleted callback
          layer.zoneName = zone.name;
          drawnItems.addLayer(layer);
        }
      });
    }

    const drawControl = new (L.Control as any).Draw({
      edit: {
        featureGroup: drawnItems,
        remove: true
      },
      draw: {
        polygon: {
          allowIntersection: false,
          showArea: true,
          drawError: {
            color: '#ef4444',
            timeout: 1000
          },
          shapeOptions: {
            color: '#6366f1',
            fillColor: '#6366f1',
            fillOpacity: 0.2,
            weight: 3
          }
        },
        rectangle: {
          shapeOptions: {
            color: '#10b981',
            fillColor: '#10b981',
            fillOpacity: 0.2,
            weight: 3
          }
        },
        circle: {
          shapeOptions: {
            color: '#f59e0b',
            fillColor: '#f59e0b',
            fillOpacity: 0.2,
            weight: 3
          }
        },
        polyline: false,
        marker: false,
        circlemarker: false
      }
    });

    map.addControl(drawControl);

    const handleCreated = (e: any) => {
      // Remove it from temporary drawnItems so our react-rendered state can draw it cleanly instead
      const layer = e.layer;
      drawnItems.addLayer(layer);
      onCreated(e);
    };

    const handleEdited = (e: any) => {
      const layers = e.layers;
      const updates: any[] = [];
      layers.eachLayer((layer: any) => {
        if (layer.zoneId) {
          const updatedZone: any = { id: layer.zoneId };
          if (layer instanceof L.Circle) {
            const latLng = layer.getLatLng();
            updatedZone.center = [latLng.lat, latLng.lng];
            updatedZone.radius = layer.getRadius();
            updatedZone.type = 'circle';
          } else if (layer instanceof L.Rectangle) {
            const latLngs = (layer as any).getLatLngs()[0];
            updatedZone.bounds = latLngs.map((ll: any) => [ll.lat, ll.lng]);
            updatedZone.type = 'rectangle';
          } else if (layer instanceof L.Polygon) {
            const latLngs = (layer as any).getLatLngs()[0];
            updatedZone.bounds = latLngs.map((ll: any) => [ll.lat, ll.lng]); // Leaflet rectangles and polygons both use getLatLngs
            updatedZone.positions = latLngs.map((ll: any) => [ll.lat, ll.lng]);
            updatedZone.type = 'polygon';
          }
          updates.push(updatedZone);
        }
      });

      if (onBulkSave && updates.length > 0) {
        onBulkSave(updates);
      }
      if (onEdited) onEdited(e);
    };

    const handleDeleted = (e: any) => {
      const layers = e.layers;
      const deletedIds: string[] = [];
      layers.eachLayer((layer: any) => {
        if (layer.zoneId) {
          deletedIds.push(layer.zoneId);
        }
      });

      if (onBulkDelete && deletedIds.length > 0) {
        onBulkDelete(deletedIds);
      }
      if (onDeleted) onDeleted(e);
    };

    map.on((L as any).Draw.Event.CREATED, handleCreated);
    map.on((L as any).Draw.Event.EDITED, handleEdited);
    map.on((L as any).Draw.Event.DELETED, handleDeleted);

    return () => {
      map.removeControl(drawControl);
      map.off((L as any).Draw.Event.CREATED, handleCreated);
      map.off((L as any).Draw.Event.EDITED, handleEdited);
      map.off((L as any).Draw.Event.DELETED, handleDeleted);
      map.removeLayer(drawnItems);
    };
  }, [map, onCreated, onEdited, onDeleted, customZones, isBulkEditActive, onBulkSave, onBulkDelete]);

  return null;
}
