import type {
  RideRequest,
  RideCluster,
  Coordinates,
  TimeRange,
} from '@rideshare/shared';
import {
  haversineDistanceMeters,
  calculateCentroid,
  doTimeRangesOverlap,
  getTimeRangeOverlap,
  calculateCo2Savings,
  haversineDistance,
} from '@rideshare/shared';
import { rideRequestRepository } from '../repositories/index.js';
import { config } from '../config/index.js';
import { logger } from '../config/logger.js';

/**
 * ============================================
 * CLUSTERING SERVICE
 * Implements DBSCAN-like algorithm for grouping
 * ride requests geographically and temporally
 * ============================================
 * 
 * This is the "FAANG Interview Logic" - demonstrates:
 * 1. Spatial clustering (geographic proximity)
 * 2. Temporal clustering (overlapping time windows)
 * 3. Optimization for pooled rides
 */

interface ClusterPoint {
  request: RideRequest;
  clusterId: number;
  visited: boolean;
}

// DBSCAN parameters
const EPSILON_METERS = 1000; // 1km radius for clustering
const MIN_POINTS = 2; // Minimum points to form a cluster

export class ClusteringService {
  /**
   * Main clustering function using DBSCAN algorithm
   * Groups requests that are:
   * 1. Within 1km of each other (spatial)
   * 2. Have overlapping pickup windows (temporal using tsrange)
   */
  async clusterRideRequests(
    center: Coordinates,
    radiusMeters: number = 5000
  ): Promise<RideCluster[]> {
    // Fetch pending requests in the area
    const requests = await rideRequestRepository.getPendingRequestsInArea(
      center,
      radiusMeters,
      200 // Max 200 requests to process
    );

    if (requests.length < MIN_POINTS) {
      return [];
    }

    logger.info(`Clustering ${requests.length} ride requests`);

    // Initialize points for DBSCAN
    const points: ClusterPoint[] = requests.map(request => ({
      request,
      clusterId: -1, // -1 means unclustered
      visited: false,
    }));

    let currentClusterId = 0;

    // DBSCAN main loop
    for (const point of points) {
      if (point.visited) continue;
      point.visited = true;

      // Find neighbors (within epsilon distance AND overlapping time)
      const neighbors = this.getNeighbors(point, points);

      if (neighbors.length < MIN_POINTS) {
        // Mark as noise (will remain unclustered)
        continue;
      }

      // Start a new cluster
      point.clusterId = currentClusterId;
      
      // Expand cluster
      this.expandCluster(point, neighbors, points, currentClusterId);
      currentClusterId++;
    }

    // Convert clustered points to RideCluster objects
    return this.buildClusters(points, currentClusterId);
  }

  /**
   * Find all neighboring points (within epsilon and overlapping time)
   */
  private getNeighbors(
    point: ClusterPoint,
    allPoints: ClusterPoint[]
  ): ClusterPoint[] {
    return allPoints.filter(other => {
      if (other === point) return false;

      // Check spatial distance
      const distance = haversineDistanceMeters(
        point.request.pickupLocation,
        other.request.pickupLocation
      );
      if (distance > EPSILON_METERS) return false;

      // Check temporal overlap (using tsrange logic)
      const hasTimeOverlap = doTimeRangesOverlap(
        point.request.pickupWindow,
        other.request.pickupWindow
      );

      return hasTimeOverlap;
    });
  }

  /**
   * Expand cluster by adding reachable points
   */
  private expandCluster(
    point: ClusterPoint,
    neighbors: ClusterPoint[],
    allPoints: ClusterPoint[],
    clusterId: number
  ): void {
    const queue = [...neighbors];

    while (queue.length > 0) {
      const current = queue.shift()!;

      if (!current.visited) {
        current.visited = true;
        const currentNeighbors = this.getNeighbors(current, allPoints);

        if (currentNeighbors.length >= MIN_POINTS) {
          // Add new neighbors to queue
          for (const neighbor of currentNeighbors) {
            if (!queue.includes(neighbor) && neighbor.clusterId === -1) {
              queue.push(neighbor);
            }
          }
        }
      }

      // Add to cluster if not already in one
      if (current.clusterId === -1) {
        current.clusterId = clusterId;
      }
    }
  }

  /**
   * Build RideCluster objects from clustered points
   */
  private buildClusters(
    points: ClusterPoint[],
    numClusters: number
  ): RideCluster[] {
    const clusters: RideCluster[] = [];

    for (let clusterId = 0; clusterId < numClusters; clusterId++) {
      const clusterPoints = points.filter(p => p.clusterId === clusterId);

      if (clusterPoints.length < MIN_POINTS) continue;

      const requests = clusterPoints.map(p => p.request);
      
      // Calculate cluster centroid
      const centroid = calculateCentroid(
        requests.map(r => r.pickupLocation)
      );

      // Calculate cluster radius (max distance from centroid)
      const radius = Math.max(
        ...requests.map(r => 
          haversineDistanceMeters(centroid, r.pickupLocation)
        )
      );

      // Calculate average pickup window
      const averagePickupWindow = this.calculateAverageTimeWindow(requests);

      // Calculate potential CO2 savings
      const potentialSavings = this.calculatePotentialSavings(requests);

      clusters.push({
        id: `cluster-${clusterId}-${Date.now()}`,
        centroid,
        radius,
        requests,
        averagePickupWindow,
        potentialSavings,
      });
    }

    // Sort clusters by potential savings (best opportunities first)
    clusters.sort((a, b) => b.potentialSavings - a.potentialSavings);

    logger.info(`Created ${clusters.length} clusters from ${points.length} requests`);
    return clusters;
  }

  /**
   * Calculate the intersection/average of all time windows
   */
  private calculateAverageTimeWindow(requests: RideRequest[]): TimeRange {
    // Find the latest start and earliest end among all windows
    let latestStart = new Date(0);
    let earliestEnd = new Date(8640000000000000); // Max date

    for (const request of requests) {
      if (request.pickupWindow.start > latestStart) {
        latestStart = request.pickupWindow.start;
      }
      if (request.pickupWindow.end < earliestEnd) {
        earliestEnd = request.pickupWindow.end;
      }
    }

    // If there's no valid overlap, use the first request's window
    if (latestStart >= earliestEnd) {
      return requests[0]!.pickupWindow;
    }

    return {
      start: latestStart,
      end: earliestEnd,
    };
  }

  /**
   * Calculate potential CO2 savings if all requests are pooled
   */
  private calculatePotentialSavings(requests: RideRequest[]): number {
    let totalSoloEmissions = 0;

    for (const request of requests) {
      // Estimate distance
      const distance = haversineDistance(
        request.pickupLocation,
        request.dropoffLocation
      );
      // Solo emissions
      totalSoloEmissions += distance * 150; // 150g CO2 per km average
    }

    // Pooled emissions (shared vehicle)
    const avgDistance = totalSoloEmissions / requests.length / 150;
    const pooledEmissions = avgDistance * 150; // One vehicle for all

    const savings = totalSoloEmissions - pooledEmissions;
    return Math.round(savings); // grams of CO2
  }

  /**
   * K-Means clustering alternative implementation
   * Useful for when you want exactly K clusters
   */
  async kMeansClustering(
    requests: RideRequest[],
    k: number = 5,
    maxIterations: number = 100
  ): Promise<RideCluster[]> {
    if (requests.length < k) {
      k = requests.length;
    }

    // Initialize centroids randomly
    let centroids: Coordinates[] = this.initializeCentroids(requests, k);
    let assignments: number[] = new Array(requests.length).fill(-1);

    for (let iter = 0; iter < maxIterations; iter++) {
      const newAssignments: number[] = [];

      // Assign each request to nearest centroid
      for (const request of requests) {
        let minDistance = Infinity;
        let nearestCentroid = 0;

        for (let c = 0; c < centroids.length; c++) {
          const distance = haversineDistanceMeters(
            request.pickupLocation,
            centroids[c]!
          );
          if (distance < minDistance) {
            minDistance = distance;
            nearestCentroid = c;
          }
        }

        newAssignments.push(nearestCentroid);
      }

      // Check for convergence
      if (JSON.stringify(newAssignments) === JSON.stringify(assignments)) {
        break;
      }
      assignments = newAssignments;

      // Update centroids
      centroids = this.updateCentroids(requests, assignments, k);
    }

    // Build clusters from assignments
    return this.buildKMeansClusters(requests, assignments, centroids, k);
  }

  private initializeCentroids(
    requests: RideRequest[],
    k: number
  ): Coordinates[] {
    // K-Means++ initialization for better initial centroids
    const centroids: Coordinates[] = [];
    
    // First centroid: random selection
    const randomIndex = Math.floor(Math.random() * requests.length);
    centroids.push(requests[randomIndex]!.pickupLocation);

    // Remaining centroids: weighted by distance squared
    while (centroids.length < k) {
      const distances: number[] = requests.map(req => {
        const minDist = Math.min(
          ...centroids.map(c => haversineDistanceMeters(req.pickupLocation, c))
        );
        return minDist * minDist;
      });

      const totalDistance = distances.reduce((a, b) => a + b, 0);
      let random = Math.random() * totalDistance;

      for (let i = 0; i < requests.length; i++) {
        random -= distances[i]!;
        if (random <= 0) {
          centroids.push(requests[i]!.pickupLocation);
          break;
        }
      }
    }

    return centroids;
  }

  private updateCentroids(
    requests: RideRequest[],
    assignments: number[],
    k: number
  ): Coordinates[] {
    const newCentroids: Coordinates[] = [];

    for (let c = 0; c < k; c++) {
      const clusterRequests = requests.filter((_, i) => assignments[i] === c);

      if (clusterRequests.length === 0) {
        // Keep old centroid if cluster is empty
        continue;
      }

      newCentroids.push(
        calculateCentroid(clusterRequests.map(r => r.pickupLocation))
      );
    }

    return newCentroids;
  }

  private buildKMeansClusters(
    requests: RideRequest[],
    assignments: number[],
    centroids: Coordinates[],
    k: number
  ): RideCluster[] {
    const clusters: RideCluster[] = [];

    for (let c = 0; c < k; c++) {
      const clusterRequests = requests.filter((_, i) => assignments[i] === c);

      if (clusterRequests.length < 2) continue;

      // Filter by time overlap
      const timeFilteredRequests = this.filterByTimeOverlap(clusterRequests);

      if (timeFilteredRequests.length < 2) continue;

      const centroid = centroids[c]!;
      const radius = Math.max(
        ...timeFilteredRequests.map(r =>
          haversineDistanceMeters(centroid, r.pickupLocation)
        )
      );

      clusters.push({
        id: `kmeans-${c}-${Date.now()}`,
        centroid,
        radius,
        requests: timeFilteredRequests,
        averagePickupWindow: this.calculateAverageTimeWindow(timeFilteredRequests),
        potentialSavings: this.calculatePotentialSavings(timeFilteredRequests),
      });
    }

    return clusters.sort((a, b) => b.potentialSavings - a.potentialSavings);
  }

  /**
   * Filter requests that have at least some time overlap with others
   */
  private filterByTimeOverlap(requests: RideRequest[]): RideRequest[] {
    return requests.filter(request => {
      const hasOverlap = requests.some(other => {
        if (other.id === request.id) return false;
        return doTimeRangesOverlap(request.pickupWindow, other.pickupWindow);
      });
      return hasOverlap;
    });
  }

  /**
   * Find potential pools for a specific ride request
   * Combines clustering with matching logic
   */
  async findPotentialPools(requestId: string): Promise<RideCluster[]> {
    const request = await rideRequestRepository.findById(requestId);
    if (!request) {
      return [];
    }

    // Find overlapping requests using tsrange
    const overlapping = await rideRequestRepository.findOverlappingRequests(
      request.pickupWindow,
      request.pickupLocation,
      EPSILON_METERS,
      requestId
    );

    if (overlapping.length === 0) {
      return [];
    }

    // Include the original request and cluster
    const allRequests = [request, ...overlapping];
    
    // Use DBSCAN on this subset
    const points: ClusterPoint[] = allRequests.map(r => ({
      request: r,
      clusterId: -1,
      visited: false,
    }));

    // Simple single-cluster for the immediate matches
    const centroid = calculateCentroid(allRequests.map(r => r.pickupLocation));
    const radius = Math.max(
      ...allRequests.map(r => haversineDistanceMeters(centroid, r.pickupLocation))
    );

    return [{
      id: `pool-${requestId}-${Date.now()}`,
      centroid,
      radius,
      requests: allRequests,
      averagePickupWindow: this.calculateAverageTimeWindow(allRequests),
      potentialSavings: this.calculatePotentialSavings(allRequests),
    }];
  }
}

export const clusteringService = new ClusteringService();
