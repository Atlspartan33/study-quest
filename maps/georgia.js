// Simplified Georgia map: state outline + the three regions 2nd grade uses
// (Mountains / Piedmont / Coastal Plain). Shapes are drawn from rough lat/lon points —
// recognizable, not survey-accurate. Reusable by any unit with a station { type: 'map', map: 'georgia' }.

const K = 100, COS = 0.843; // equirectangular at ~32.5°N
const W0 = -85.75, N0 = 35.1;
const px = ([lat, lon]) => [+((lon - W0) * K * COS).toFixed(1), +((N0 - lat) * K).toFixed(1)];
const unproject = (x, y) => [N0 - y / K, x / (K * COS) + W0];

const OUTLINE = [
  [35.0, -85.605], [35.0, -83.108], [34.82, -83.32], [34.68, -83.35], [34.48, -83.05], [34.2, -82.75],
  [33.95, -82.55], [33.65, -82.2], [33.47, -81.95], [33.15, -81.75], [32.85, -81.45], [32.5, -81.15],
  [32.2, -81.12], [32.08, -81.0], [32.03, -80.88], [31.85, -81.05], [31.6, -81.15], [31.3, -81.3],
  [31.0, -81.42], [30.71, -81.45], [30.55, -81.75], [30.4, -82.03], [30.58, -82.2], [30.65, -83.3],
  [30.68, -84.1], [30.71, -84.86], [31.0, -85.0], [31.25, -85.1], [31.6, -85.06], [32.0, -85.05],
  [32.25, -84.93], [32.46, -84.99], [32.62, -85.08], [32.86, -85.18],
];

// Line between Mountains and Piedmont (slants up toward the northeast).
const mountLat = lon => 34.1 + (lon + 85.8) * (0.5 / 2.9);
// The Fall Line: Columbus → Macon → Augusta.
const FALL = [[-86, 32.42], [-84.99, 32.46], [-83.63, 32.84], [-81.97, 33.47], [-80, 33.85]];
function fallLat(lon) {
  for (let i = 0; i < FALL.length - 1; i++) {
    const [a, la] = FALL[i], [b, lb] = FALL[i + 1];
    if (lon >= a && lon <= b) return la + (lon - a) / (b - a) * (lb - la);
  }
  return lon < FALL[0][0] ? FALL[0][1] : FALL.at(-1)[1];
}

function inside(lat, lon) {
  let hit = false;
  for (let i = 0, j = OUTLINE.length - 1; i < OUTLINE.length; j = i++) {
    const [yi, xi] = OUTLINE[i], [yj, xj] = OUTLINE[j];
    if ((yi > lat) !== (yj > lat) && lon < (xj - xi) * (lat - yi) / (yj - yi) + xi) hit = !hit;
  }
  return hit;
}

const LONS = [-86, -85, -84, -83, -82, -81, -80];
const poly = pts => 'M' + pts.map(p => px(p).join(',')).join('L') + 'Z';
const mountLine = LONS.map(lon => [mountLat(lon), lon]);
const fallLine = LONS.map(lon => [fallLat(lon), lon]);

export const georgia = {
  viewBox: '0 0 425 485',
  outline: poly(OUTLINE),
  regions: [
    { id: 'mountains', label: 'Mountains', icon: '⛰️', color: '#2E9E62', at: px([34.62, -84.35]),
      path: poly([[36, -86], [36, -80], ...[...mountLine].reverse()]) },
    { id: 'piedmont', label: 'Piedmont', icon: '🌳', color: '#E3A21A', at: px([33.35, -83.9]),
      path: poly([...mountLine, ...[...fallLine].reverse()]) },
    { id: 'coastal', label: 'Coastal Plain', icon: '🌊', color: '#2F7FD8', at: px([31.55, -82.75]),
      path: poly([...fallLine, [29, -80], [29, -86]]) },
  ],
  home: { label: 'We live here!', at: px([33.98, -84.42]) },
  regionAt(x, y) {
    const [lat, lon] = unproject(x, y);
    if (!inside(lat, lon)) return null;
    if (lat > mountLat(lon)) return 'mountains';
    return lat > fallLat(lon) ? 'piedmont' : 'coastal';
  },
};

export const MAPS = { georgia };
