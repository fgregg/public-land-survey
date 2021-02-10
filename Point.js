class Point {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }

  subtract(otherPoint) {
    return new Point(this.x - otherPoint.x, this.y - otherPoint.y);
  }

  get length() {
    // distance from the origin to the point
    return Math.hypot(...this);
  }

  get angleDegrees() {
    // angle in degrees between the x axis and the ray passing
    // through the point
    let degrees = Math.atan2(this.y, this.x) * (180 / Math.PI);
    if (degrees < 0) {
      degrees += 360;
    }
    return degrees;
  }

  * [Symbol.iterator]() {
    yield this.x;
    yield this.y;
  }
}

export { Point as default };
