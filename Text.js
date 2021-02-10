"use strict";

export class Text {
    constructor(body) {
        this.body = body;
        this.compass_quadrants = ["east", "northeast", "north", "northwest", "west", "southwest", "south", "southeast", "east"];

    }

    current_cover(cover) {
        this.body.innerHTML = `<p id='location'>You are in a <strong>${cover.cover_type.toLowerCase()}</strong>.</p>`;
    }

    async nearby_covers(near_covers) {

        const covers_by_direction = new Map(this.compass_quadrants.map(direction => [direction, []]));
        for await (const cover of near_covers) {
            const direction = this.cardinalDirection(cover.closest_point());
            covers_by_direction.get(direction).push(cover);
        }

        this.body.innerHTML += '<p>';
        for (const direction of this.compass_quadrants) {
            let covers = covers_by_direction.get(direction);
            if (covers.length === 0) {
                continue
            }
            covers.map(cover => { cover.closest_point = cover.closest_point();
                                  cover.distance = cover.closest_point.length();
                                  cover.direction = direction})
            covers.sort((a, b) => a.distance - b.distance);
            let sentence = this.cover_sentence(covers)
            this.body.innerHTML += sentence + '. ';
        }
        this.body.innerHTML += '</p>';
    }

    cover_sentence(covers) {
        const sentence_patterns = [(direction, distance, cover) => `To the ${direction}, there is a ${cover} in about ${distance}`,
                                   (direction, distance, cover) => `There is a ${cover} about ${distance} ${direction} of here`,
                                   (direction, distance, cover) => `To the ${direction}, in about ${distance}, there is a ${cover}`];
        sentence_patterns.sample = function () {
            return this[Math.floor(Math.random() * this.length)];
        };


        let sentence = '';
        for (const [idx, cover] of covers.entries()) {
            const distance = this.meters_to_miles(cover.distance);
            let human_distance;
            if (idx === 0) {
                if (distance < 0.0625) {
                    sentence = `There is a ${cover.cover_type.toLowerCase()} just to the ${cover.direction}`;
                } else {
                    if (distance > 0.9375) {
                        human_distance = 'a mile';
                    } else {
                        human_distance = `${this.human_fractions(distance)} of a mile`;
                    }
                    sentence = sentence_patterns.sample()(cover.direction, human_distance, cover.cover_type.toLowerCase());
                }
            } else if (idx < (covers.length - 1)) {
                if (distance > 0.9375) {
                    sentence += `, a ${cover.cover_type.toLowerCase()} in about a mile`;
                } else {
                    sentence += `, a ${cover.cover_type.toLowerCase()} in about ${this.human_fractions(distance)} of a mile`;
                }
            } else {
                if (distance > 0.9375) {
                    sentence += ` and a ${cover.cover_type.toLowerCase()} in about a mile`;
                } else {
                    sentence += ` and a ${cover.cover_type.toLowerCase()} in about ${this.human_fractions(distance)} of a mile`;
                }
            }
        }
        return sentence
    }

    cardinalDirection(point) {
        const degrees = point.angle_degrees();
        return this.compass_quadrants[Math.round(degrees / 45)];
    }

    meters_to_miles(meters) {
        return meters * 0.000621371;
    }

    human_fractions(distance) {
        const vulgar_fractions = [undefined, '⅛', '¼', '½', '½', '½', '¾', '¾', undefined];
        return vulgar_fractions[Math.round(distance / 0.125)];

    }

}
