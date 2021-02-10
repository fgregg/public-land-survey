/* eslint-disable no-restricted-syntax */
import Point from './Point.js';

class Cover {
  constructor(ring, coverType) {
    this.ring = ring.map((pointArray) => new Point(...pointArray));
    this.coverType = coverType;
  }

  center(originPoint) {
    this.ring = this.ring.map((point) => point.subtract(originPoint));
  }

  get closestPoint() {
    // closest point in the polygon to the origin
    let minDistance = Infinity;
    let closestPoint;
    for (const point of this.ring) {
      const dist = point.length;
      if (dist < minDistance) {
        minDistance = dist;
        closestPoint = point;
      }
    }
    return closestPoint;
  }
}

export { Cover as default };
