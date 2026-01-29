import { BaseRepository } from './BaseRepository.js';
import type { Vehicle, VehicleType } from '@rideshare/shared';

interface VehicleRow {
  id: string;
  driver_id: string;
  make: string;
  model: string;
  year: number;
  color: string;
  license_plate: string;
  type: VehicleType;
  capacity: number;
  wheelchair_accessible: boolean;
  co2_per_km: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

interface CreateVehicleData {
  driverId: string;
  make: string;
  model: string;
  year: number;
  color: string;
  licensePlate: string;
  type: VehicleType;
  capacity: number;
  wheelchairAccessible?: boolean;
  co2PerKm: number;
}

export class VehicleRepository extends BaseRepository<Vehicle> {
  protected tableName = 'vehicles';

  private mapRowToVehicle(row: VehicleRow): Vehicle {
    return {
      id: row.id,
      driverId: row.driver_id,
      make: row.make,
      model: row.model,
      year: row.year,
      color: row.color,
      licensePlate: row.license_plate,
      type: row.type,
      capacity: row.capacity,
      wheelchairAccessible: row.wheelchair_accessible,
      co2PerKm: parseFloat(row.co2_per_km),
      isActive: row.is_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  async findById(id: string): Promise<Vehicle | null> {
    const result = await this.query<VehicleRow>(
      'SELECT * FROM vehicles WHERE id = $1',
      [id]
    );
    return result.rows[0] ? this.mapRowToVehicle(result.rows[0]) : null;
  }

  async findByDriverId(driverId: string): Promise<Vehicle[]> {
    const result = await this.query<VehicleRow>(
      'SELECT * FROM vehicles WHERE driver_id = $1 ORDER BY created_at DESC',
      [driverId]
    );
    return result.rows.map(row => this.mapRowToVehicle(row));
  }

  async findActiveByDriverId(driverId: string): Promise<Vehicle | null> {
    const result = await this.query<VehicleRow>(
      'SELECT * FROM vehicles WHERE driver_id = $1 AND is_active = true LIMIT 1',
      [driverId]
    );
    return result.rows[0] ? this.mapRowToVehicle(result.rows[0]) : null;
  }

  async create(data: CreateVehicleData): Promise<Vehicle> {
    const result = await this.query<VehicleRow>(
      `INSERT INTO vehicles (
        driver_id, make, model, year, color, license_plate,
        type, capacity, wheelchair_accessible, co2_per_km
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *`,
      [
        data.driverId,
        data.make,
        data.model,
        data.year,
        data.color,
        data.licensePlate,
        data.type,
        data.capacity,
        data.wheelchairAccessible ?? false,
        data.co2PerKm,
      ]
    );

    return this.mapRowToVehicle(result.rows[0]!);
  }

  async setActive(id: string, driverId: string): Promise<void> {
    await this.withTransaction(async (client) => {
      // Deactivate all other vehicles for this driver
      await client.query(
        'UPDATE vehicles SET is_active = false WHERE driver_id = $1',
        [driverId]
      );
      // Activate the specified vehicle
      await client.query(
        'UPDATE vehicles SET is_active = true WHERE id = $1 AND driver_id = $2',
        [id, driverId]
      );
    });
  }
}

export const vehicleRepository = new VehicleRepository();
