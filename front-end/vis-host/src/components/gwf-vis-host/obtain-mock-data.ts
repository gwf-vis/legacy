export function fetchData(query: any) {
  switch (query?.type) {
    case 'shape':
      return {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: [
            {
              type: 'Feature',
              properties: {
                id: '1',
              },
              geometry: {
                type: 'Polygon',
                coordinates: [
                  [
                    [-121.28906250000001, 53.12040528310657],
                    [-113.5546875, 53.12040528310657],
                    [-113.5546875, 57.89149735271034],
                    [-121.28906250000001, 57.89149735271034],
                    [-121.28906250000001, 53.12040528310657],
                  ],
                ],
              },
            },
            {
              type: 'Feature',
              properties: {
                id: '2',
              },
              geometry: {
                type: 'Polygon',
                coordinates: [
                  [
                    [-110.390625, 57.136239319177434],
                    [-117.42187500000001, 54.36775852406841],
                    [-113.203125, 51.39920565355378],
                    [-108.6328125, 53.12040528310657],
                    [-105.1171875, 56.17002298293205],
                    [-110.390625, 57.136239319177434],
                  ],
                ],
              },
            },
          ],
        },
      };
    case 'metadata':
      return {
        Text: 'Something',
        'HTML Rich': '<img width="100%" src="https://gwf.usask.ca/images/logos/GWF_Globe.png"/>This is an icon.'
      };
    case 'values':
      let valid = false;
      for (const [key, value] of Object.entries(query?.for || {})) {
        if (Array.isArray(value) && key !== 'location') {
          return {};
        }
        if (Array.isArray(value) && key === 'location') {
          valid = true;
        }
      }
      if (valid) {
        return query.for.location.map(location => ({ location, value: seededRandom(location.toString()) * 360 }));
      }
      return {};
    default:
      return undefined;
  }
}

function seededRandom(seed: string) {
  const generateSeed = MurmurHash3(seed);
  return Mulberry32(generateSeed())();
}

function MurmurHash3(string) {
  let i = 0,
    hash;
  for (hash = 1779033703 ^ string.length; i < string.length; i++) {
    let bitwise_xor_from_character = hash ^ string.charCodeAt(i);
    hash = Math.imul(bitwise_xor_from_character, 3432918353);
    hash = (hash << 13) | (hash >>> 19);
  }
  return () => {
    // Return the hash that you can use as a seed
    hash = Math.imul(hash ^ (hash >>> 16), 2246822507);
    hash = Math.imul(hash ^ (hash >>> 13), 3266489909);
    return (hash ^= hash >>> 16) >>> 0;
  };
}

function Mulberry32(string) {
  return () => {
    let for_bit32_mul = (string += 0x6d2b79f5);
    let cast32_one = for_bit32_mul ^ (for_bit32_mul >>> 15);
    let cast32_two = for_bit32_mul | 1;
    for_bit32_mul = Math.imul(cast32_one, cast32_two);
    for_bit32_mul ^= for_bit32_mul + Math.imul(for_bit32_mul ^ (for_bit32_mul >>> 7), for_bit32_mul | 61);
    return ((for_bit32_mul ^ (for_bit32_mul >>> 14)) >>> 0) / 4294967296;
  };
}
