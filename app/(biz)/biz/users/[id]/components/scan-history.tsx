import React from 'react';
import { VehicleType } from '../../../vehicles/admin/page';
import Link from 'next/link';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@/components/ui/accordion';

const achievementAwards = [
  {
    id: 2,
    name: '5 Scans',
    badge: '🥉',
    scans: 5
  },
  {
    id: 3,
    name: '10 Scans',
    badge: '🥈',
    scans: 10
  },
  {
    id: 4,
    name: '25 Scans',
    badge: '🏅',
    scans: 25
  },
  {
    id: 5,
    name: '50 Scans',
    badge: '🎖️',
    scans: 50
  },
  {
    id: 6,
    name: '100 Scans',
    badge: '🏆',
    scans: 100
  },
  {
    id: 7,
    name: 'Type Dune Buggy Scanned',
    badge: '🏎️',
    veh: 'buggy'
  },
  {
    id: 8,
    name: 'Type ATV Scanned',
    badge: '🏍️',
    veh: 'atv'
  },
  {
    id: 9,
    name: 'Type Truck Scanned',
    badge: '🚚',
    veh: 'truck'
  },
  {
    id: 10,
    name: 'Type Sedan Scanned',
    badge: '🚘',
    veh: 'sedan'
  },
  {
    id: 11,
    name: 'Type UTV Scanned',
    badge: '🚜',
    veh: 'utv'
  },
  {
    id: 12,
    name: 'Type Tram Scanned',
    badge: '🚃',
    veh: 'tram'
  },
  {
    id: 13,
    name: 'Type Forktruck Scanned',
    badge: '🚜',
    veh: 'forktruck'
  },
  {
    id: 14,
    name: 'Type Trailer Scanned',
    badge: '🚛',
    veh: 'trailer'
  },
  {
    id: 15,
    name: 'Type Shuttle Scanned',
    badge: '🚐',
    veh: 'shuttle'
  }
];

const ScanHistory = ({ scans }: { scans: VehicleType[] }) => {
  const uniqueScans = scans.filter(
    (scan, index, self) => index === self.findIndex((t) => t.id === scan.id)
  );
  return (
    <div className="flex flex-col gap-5">
      <Accordion type="single" collapsible>
        <AccordionItem value="scan-stats">
          <AccordionTrigger>Scan Stats</AccordionTrigger>
          <AccordionContent>
            <h2>Unique Scans : {uniqueScans.length}</h2>
            <h2>Total Scans: {scans.length}</h2>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="achievements">
          <AccordionTrigger>Achievements 🥇</AccordionTrigger>
          <AccordionContent>
            <div className="grid grid-cols-3 gap-2">
              {achievementAwards.map((award) => {
                if (award.scans) {
                  const count = Math.floor(uniqueScans.length / award.scans);
                  return (
                    <div
                      key={award.id}
                      className={count > 0 ? 'text-green-500' : 'text-gray-500'}
                    >
                      <span className="text-3xl">{award.badge}</span>
                      {award.name} X {count}
                    </div>
                  );
                }
                return null;
              })}
              {/* if uniqueScans.vehicle_type matches achievementAwards.veh, repeat the same thing */}
              {achievementAwards.map((award) => {
                if (award.veh) {
                  const count = uniqueScans.filter(
                    (scan) => scan.type === award.veh
                  ).length;
                  return (
                    <div
                      key={award.id}
                      className={count > 0 ? 'text-green-500' : 'text-gray-500'}
                    >
                      <span className="text-3xl">{award.badge}</span>
                      {award.veh} X {count}
                    </div>
                  );
                }
                return null;
              })}
            </div>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="scanned-list">
          <AccordionTrigger>Scanned List </AccordionTrigger>
          <AccordionContent>
            <div className="flex flex-col gap-4">
              {Array.from(new Set(uniqueScans.map((vehicle) => vehicle.type)))
                .sort()
                .map((type) => (
                  <div key={type}>
                    <h3 className="text-xl font-bold m-5">{type}</h3>
                    <div className="grid grid-cols-5 gap-2">
                      {uniqueScans
                        .filter((vehicle) => vehicle.type === type)
                        .sort((a, b) => a.name.localeCompare(b.name))
                        .map((vehicle) => (
                          <Link
                            href={`/biz/vehicles/${vehicle.id}`}
                            className="large_button_circular relative"
                            key={vehicle.id}
                          >
                            {vehicle.pet_name ? (
                              <>
                                {vehicle.pet_name}
                                <br />
                                {vehicle.name}
                              </>
                            ) : (
                              vehicle.name
                            )}
                            {vehicle.vehicle_status === 'broken' && (
                              <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
                            )}
                            {vehicle.vehicle_status === 'maintenance' && (
                              <span className="absolute top-0 right-0 w-2 h-2 bg-amber-500 rounded-full"></span>
                            )}
                            {vehicle.vehicle_status === 'fine' && (
                              <span className="absolute top-0 right-0 w-2 h-2 bg-green-500 rounded-full"></span>
                            )}
                          </Link>
                        ))}
                    </div>
                  </div>
                ))}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};

export default ScanHistory;
