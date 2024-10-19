'use client';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { VehicleType } from '../../page';

const icon = new L.Icon({
  iconUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  shadowSize: [41, 41]
});

type ExtendedVehicleType = VehicleType & {
  latitude: number | null;
  longitude: number | null;
  city: string;
};

interface MapComponentProps {
  vehicles: ExtendedVehicleType[];
}

const MapComponent: React.FC<MapComponentProps> = ({ vehicles }) => {
  return (
    <MapContainer
      center={[36.278439, -115.020068]}
      zoom={5}
      style={{ height: '400px', width: '100%' }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      {vehicles.map(
        (vehicle) =>
          vehicle.latitude &&
          vehicle.longitude && (
            <Marker
              key={vehicle.id}
              position={[vehicle.latitude, vehicle.longitude]}
              icon={icon}
            >
              <Popup>
                {vehicle.type} - {vehicle.city}
              </Popup>
            </Marker>
          )
      )}
    </MapContainer>
  );
};

export default MapComponent;
