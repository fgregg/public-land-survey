/* eslint-disable no-multi-str */
/* eslint-disable no-restricted-syntax */
class Text {
  constructor(main) {
    this.main = main;
    this.compassQuadrants = ['east', 'northeast', 'north', 'northwest', 'west', 'southwest', 'south', 'southeast', 'east'];
  }

  currentCover(coverType) {
    this.main.innerHTML = `<p id='location'>This was a <strong>${coverType.toLowerCase()}</strong>.</p>`;
  }

  async nearbyCovers(nearCovers) {
    const coversByDirection = new Map(this.compassQuadrants.map((direction) => [direction, []]));
    for await (const cover of nearCovers) {
      const direction = this.cardinalDirection(cover.closestPoint);
      coversByDirection.get(direction).push(cover);
    }

    this.main.innerHTML += '<p>';

    // we repeat "east" at the beginning and end of compassQuadrants,
    // so we want to avoid the last "east"
    for (const direction of this.compassQuadrants.slice(0, -1)) {
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
      const sentence = Text.coverSentence(covers);
      this.main.innerHTML += `${sentence}. `;
    }
    this.main.innerHTML += '</p>';
  }

  static coverSentence(covers) {
    const sentencePatterns = [(direction, distance, cover) => `To the ${direction}, there was a ${cover} in about ${distance}`,
                              (direction, distance, cover) => `There was a ${cover} about ${distance} ${direction} of here`,
                              (direction, distance, cover) => `To the ${direction}, in about ${distance}, there was a ${cover}`];
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
          sentence = sentencePatterns.sample()(
            cover.direction,
            humanDistance,
            cover.coverType.toLowerCase()
          );
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

  footer(source) {
    const body = document.getElementById('main');
    body.innerHTML += `<footer class="footer">${source}</footer>`;
  }

  cardinalDirection(point) {
    const degrees = point.angleDegrees;
    return this.compassQuadrants[Math.round(degrees / 45)];
  }

  static metersToMiles(meters) {
    return meters * 0.000621371;
  }

  static humanFractions(distance) {
    const vulgarFractions = [undefined, '⅛', '¼', '½', '½', '½', '¾', '¾', undefined];
    return vulgarFractions[Math.round(distance / 0.125)];
  }

  introText() {
    this.main.innerHTML = (
      '<p>This site tells you something about what the land looked like 200 years ago at your current location (if that location is within the current states of Illinois and Michigan).</p>\
       <p>In the 19th century, the United States Federal Government <a href="https://en.wikipedia.org/wiki/Public_Land_Survey_System">surveyed the territories and states they were colonizing</a>. \
          These surveys included information about natural features like forests, swamps, and prairies. The detailed survey notes sometimes included notes about the tree types. Starting in the 1990s, \
          some US states interpreted these surveys to produce digital maps of historic vegetation. This site uses those interpretations.</p>\
       <p>These original surveys were both a product of the theft of native lands and a facilitator of further expropriation. This was not an \
          empty and unpeopled wilderness, but the land of indigenous people. While this site highlights natural features, many "natural" features were the product of active management of the original inhabitants. To learn more \
          about who\'s land this is, visit <a href="https://native-land.ca/">Native-Land.ca</a>.</p>\
       <p>To use this site, you have to let your web browser share your location. We don\'t keep that information or track you in any way</p>\
       <button id="geolocate">Continue</button>'
    );
  }
}

export { Text as default };
