/* eslint-disable no-restricted-syntax */
class Text {
  constructor(body) {
    this.body = body;
  }

  static compassQuadrants = ['east', 'northeast', 'north', 'northwest', 'west', 'southwest', 'south', 'southeast', 'east'];

  currentCover(cover) {
    this.body.innerHTML = `<p id='location'>You are in a <strong>${cover.coverType.toLowerCase()}</strong>.</p>`;
  }

  async nearbyCovers(nearCovers) {
    const coversByDirection = new Map(Text.compassQuadrants.map((direction) => [direction, []]));
    for await (const cover of nearCovers) {
      const direction = Text.cardinalDirection(cover.closestPoint);
      coversByDirection.get(direction).push(cover);
    }

    this.body.innerHTML += '<p>';
    for (const direction of Text.compassQuadrants) {
      const covers = coversByDirection.get(direction);
      if (covers.length === 0) {
        // eslint-disable-next-line no-continue
        continue;
      }

      for (const cover of covers) {
        cover.distance = cover.closestPoint.length;
        cover.direction = direction;
      }

      covers.sort((a, b) => a.distance - b.distance);
      const sentence = this.coverSentence(covers);
      this.body.innerHTML += `${sentence}. `;
    }
    this.body.innerHTML += '</p>';
  }

  coverSentence(covers) {
    const sentencePatterns = [(direction, distance, cover) => `To the ${direction}, there is a ${cover} in about ${distance}`,
                              (direction, distance, cover) => `There is a ${cover} about ${distance} ${direction} of here`,
                              (direction, distance, cover) => `To the ${direction}, in about ${distance}, there is a ${cover}`];
    // eslint-disable-next-line func-names
    sentencePatterns.sample = function () {
      return this[Math.floor(Math.random() * this.length)];
    };

    let sentence;
    for (const [idx, cover] of covers.entries()) {
      const distance = Text.metersToMiles(cover.distance);
      let humanDistance;
      if (idx === 0) {
        if (distance < 0.0625) {
          sentence = `There is a ${cover.coverType.toLowerCase()} just to the ${cover.direction}`;
        } else {
          if (distance > 0.9375) {
            humanDistance = 'a mile';
          } else {
            humanDistance = `${Text.humanFractions(distance)} of a mile`;
          }
          sentence = sentencePatterns.sample()(cover.direction, humanDistance, cover.coverType.toLowerCase());
        }
      } else if (idx < (covers.length - 1)) {
        if (distance > 0.9375) {
          sentence += `, a ${cover.coverType.toLowerCase()} in about a mile`;
        } else {
          sentence += `, a ${cover.coverType.toLowerCase()} in about ${Text.humanFractions(distance)} of a mile`;
        }
      } else if (distance > 0.9375) {
        sentence += ` and a ${cover.coverType.toLowerCase()} in about a mile`;
      } else {
        sentence += ` and a ${cover.coverType.toLowerCase()} in about ${Text.humanFractions(distance)} of a mile`;
      }
    }
    return sentence;
  }

  static cardinalDirection(point) {
    const degrees = point.angleDegrees;
    return Text.compassQuadrants[Math.round(degrees / 45)];
  }

  static metersToMiles(meters) {
    return meters * 0.000621371;
  }

  static humanFractions(distance) {
    const vulgarFractions = [undefined, '⅛', '¼', '½', '½', '½', '¾', '¾', undefined];
    return vulgarFractions[Math.round(distance / 0.125)];
  }
}

export { Text as default };