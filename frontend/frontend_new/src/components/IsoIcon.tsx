import type { DirCode } from '../api/types';

// Minimal isometric pictograms, one per direction.
const ICONS: Record<DirCode, { viewBox: string; body: JSX.Element }> = {
  T: {
    viewBox: '-42.4 -7.8 84.7 60.0',
    body: (
      <>
        <polygon points="-36.4,25.2 0.0,46.2 0.0,42.0 -36.4,21.0" fill="#E2DCCD" stroke="#E2DCCD" strokeWidth="0.6" strokeLinejoin="round" /><polygon points="36.4,25.2 0.0,46.2 0.0,42.0 36.4,21.0" fill="#CEC6B4" stroke="#CEC6B4" strokeWidth="0.6" strokeLinejoin="round" /><polygon points="0.0,0.0 36.4,21.0 0.0,42.0 -36.4,21.0" fill="#F1ECE1" stroke="#F1ECE1" strokeWidth="0.6" strokeLinejoin="round" /><polygon points="-25.5,14.7 10.9,35.7 10.9,35.3 -25.5,14.3" fill="#3A4552" stroke="#3A4552" strokeWidth="0.6" strokeLinejoin="round" /><polygon points="24.2,28.0 10.9,35.7 10.9,35.3 24.2,27.6" fill="#2C3540" stroke="#2C3540" strokeWidth="0.6" strokeLinejoin="round" /><polygon points="-12.1,6.6 24.2,27.6 10.9,35.3 -25.5,14.3" fill="#4A5563" stroke="#4A5563" strokeWidth="0.6" strokeLinejoin="round" /><polygon points="-19.4,15.0 3.6,28.3 3.6,17.1 -19.4,3.8" fill="#0B5C8C" stroke="#0B5C8C" strokeWidth="0.6" strokeLinejoin="round" /><polygon points="12.1,23.4 3.6,28.3 3.6,17.1 12.1,12.2" fill="#084A71" stroke="#084A71" strokeWidth="0.6" strokeLinejoin="round" /><polygon points="-10.9,-1.1 12.1,12.2 3.6,17.1 -19.4,3.8" fill="#6FA8CF" stroke="#6FA8CF" strokeWidth="0.6" strokeLinejoin="round" /><polygon points="-19.4,3.8 3.6,17.1 3.6,16.4 -19.4,3.1" fill="#8DB7D4" stroke="#8DB7D4" strokeWidth="0.6" strokeLinejoin="round" /><polygon points="12.1,12.2 3.6,17.1 3.6,16.4 12.1,11.5" fill="#6E9DBE" stroke="#6E9DBE" strokeWidth="0.6" strokeLinejoin="round" /><polygon points="-10.9,-1.8 12.1,11.5 3.6,16.4 -19.4,3.1" fill="#BFD8E9" stroke="#BFD8E9" strokeWidth="0.6" strokeLinejoin="round" />
      </>
    ),
  },
  E: {
    viewBox: '-42.4 -19.2 84.7 71.4',
    body: (
      <>
        <polygon points="-36.4,25.2 0.0,46.2 0.0,42.0 -36.4,21.0" fill="#E2DCCD" stroke="#E2DCCD" strokeWidth="0.6" strokeLinejoin="round" /><polygon points="36.4,25.2 0.0,46.2 0.0,42.0 36.4,21.0" fill="#CEC6B4" stroke="#CEC6B4" strokeWidth="0.6" strokeLinejoin="round" /><polygon points="0.0,0.0 36.4,21.0 0.0,42.0 -36.4,21.0" fill="#F1ECE1" stroke="#F1ECE1" strokeWidth="0.6" strokeLinejoin="round" /><polygon points="-36.4,21.0 0.0,42.0 0.0,41.3 -36.4,20.3" fill="#B5D1A9" stroke="#B5D1A9" strokeWidth="0.6" strokeLinejoin="round" /><polygon points="36.4,21.0 0.0,42.0 0.0,41.3 36.4,20.3" fill="#9ABD8C" stroke="#9ABD8C" strokeWidth="0.6" strokeLinejoin="round" /><polygon points="0.0,-0.7 36.4,20.3 0.0,41.3 -36.4,20.3" fill="#CFE3C6" stroke="#CFE3C6" strokeWidth="0.6" strokeLinejoin="round" /><polygon points="-3.9,11.9 -2.4,12.7 -2.4,1.5 -3.9,0.7" fill="#3A4552" stroke="#3A4552" strokeWidth="0.6" strokeLinejoin="round" /><polygon points="-1.0,11.9 -2.4,12.7 -2.4,1.5 -1.0,0.7" fill="#2C3540" stroke="#2C3540" strokeWidth="0.6" strokeLinejoin="round" /><polygon points="-2.4,-0.1 -1.0,0.7 -2.4,1.5 -3.9,0.7" fill="#5B6470" stroke="#5B6470" strokeWidth="0.6" strokeLinejoin="round" /><circle cx="-2.4" cy="-5.5" r="7.7" fill="#7FAE78" /><circle cx="-4.7" cy="-7.8" r="3.5" fill="#A9CFA3" /><polygon points="-18.4,23.1 -17.0,23.9 -17.0,16.9 -18.4,16.1" fill="#3A4552" stroke="#3A4552" strokeWidth="0.6" strokeLinejoin="round" /><polygon points="-15.5,23.1 -17.0,23.9 -17.0,16.9 -15.5,16.1" fill="#2C3540" stroke="#2C3540" strokeWidth="0.6" strokeLinejoin="round" /><polygon points="-17.0,15.3 -15.5,16.1 -17.0,16.9 -18.4,16.1" fill="#5B6470" stroke="#5B6470" strokeWidth="0.6" strokeLinejoin="round" /><circle cx="-17.0" cy="11.6" r="5.6" fill="#7FAE78" /><circle cx="-18.7" cy="9.9" r="2.5" fill="#A9CFA3" /><polygon points="1.0,27.3 2.4,28.1 2.4,12.7 1.0,11.9" fill="#3A4552" stroke="#3A4552" strokeWidth="0.6" strokeLinejoin="round" /><polygon points="3.9,27.3 2.4,28.1 2.4,12.7 3.9,11.9" fill="#2C3540" stroke="#2C3540" strokeWidth="0.6" strokeLinejoin="round" /><polygon points="2.4,11.1 3.9,11.9 2.4,12.7 1.0,11.9" fill="#5B6470" stroke="#5B6470" strokeWidth="0.6" strokeLinejoin="round" /><circle cx="2.4" cy="5.2" r="8.4" fill="#7FAE78" /><circle cx="-0.1" cy="2.7" r="3.8" fill="#A9CFA3" />
      </>
    ),
  },
  S: {
    viewBox: '-42.4 -18.6 84.7 70.8',
    body: (
      <>
        <polygon points="-36.4,25.2 0.0,46.2 0.0,42.0 -36.4,21.0" fill="#E2DCCD" stroke="#E2DCCD" strokeWidth="0.6" strokeLinejoin="round" /><polygon points="36.4,25.2 0.0,46.2 0.0,42.0 36.4,21.0" fill="#CEC6B4" stroke="#CEC6B4" strokeWidth="0.6" strokeLinejoin="round" /><polygon points="0.0,0.0 36.4,21.0 0.0,42.0 -36.4,21.0" fill="#F1ECE1" stroke="#F1ECE1" strokeWidth="0.6" strokeLinejoin="round" /><polygon points="-21.8,18.2 4.8,33.6 4.8,16.8 -21.8,1.4" fill="#E8E4DA" stroke="#E8E4DA" strokeWidth="0.6" strokeLinejoin="round" /><polygon points="24.2,22.4 4.8,33.6 4.8,16.8 24.2,5.6" fill="#D3CDBF" stroke="#D3CDBF" strokeWidth="0.6" strokeLinejoin="round" /><polygon points="-2.4,-9.8 24.2,5.6 4.8,16.8 -21.8,1.4" fill="#FFFFFF" stroke="#FFFFFF" strokeWidth="0.6" strokeLinejoin="round" /><polygon points="-12.1,7.0 -4.8,11.2 -4.8,2.8 -12.1,-1.4" fill="#D9A13A" stroke="#D9A13A" strokeWidth="0.6" strokeLinejoin="round" /><polygon points="14.5,0.0 -4.8,11.2 -4.8,2.8 14.5,-8.4" fill="#B7852A" stroke="#B7852A" strokeWidth="0.6" strokeLinejoin="round" /><polygon points="7.3,-12.6 14.5,-8.4 -4.8,2.8 -12.1,-1.4" fill="#EDC36A" stroke="#EDC36A" strokeWidth="0.6" strokeLinejoin="round" /><polygon points="-1.5,36.4 0.0,37.2 0.0,30.2 -1.5,29.4" fill="#3A4552" stroke="#3A4552" strokeWidth="0.6" strokeLinejoin="round" /><polygon points="1.5,36.4 0.0,37.2 0.0,30.2 1.5,29.4" fill="#2C3540" stroke="#2C3540" strokeWidth="0.6" strokeLinejoin="round" /><polygon points="0.0,28.6 1.5,29.4 0.0,30.2 -1.5,29.4" fill="#5B6470" stroke="#5B6470" strokeWidth="0.6" strokeLinejoin="round" /><circle cx="0.0" cy="25.5" r="4.9" fill="#7FAE78" /><circle cx="-1.5" cy="24.0" r="2.2" fill="#A9CFA3" />
      </>
    ),
  },
  B: {
    viewBox: '-42.4 -26.6 84.7 78.8',
    body: (
      <>
        <polygon points="-36.4,25.2 0.0,46.2 0.0,42.0 -36.4,21.0" fill="#E2DCCD" stroke="#E2DCCD" strokeWidth="0.6" strokeLinejoin="round" /><polygon points="36.4,25.2 0.0,46.2 0.0,42.0 36.4,21.0" fill="#CEC6B4" stroke="#CEC6B4" strokeWidth="0.6" strokeLinejoin="round" /><polygon points="0.0,0.0 36.4,21.0 0.0,42.0 -36.4,21.0" fill="#F1ECE1" stroke="#F1ECE1" strokeWidth="0.6" strokeLinejoin="round" /><polygon points="-31.5,21.0 0.0,39.2 0.0,38.8 -31.5,20.6" fill="#E8E4DA" stroke="#E8E4DA" strokeWidth="0.6" strokeLinejoin="round" /><polygon points="7.3,35.0 0.0,39.2 0.0,38.8 7.3,34.6" fill="#D3CDBF" stroke="#D3CDBF" strokeWidth="0.6" strokeLinejoin="round" /><polygon points="-24.2,16.4 7.3,34.6 0.0,38.8 -31.5,20.6" fill="#FAF9F5" stroke="#FAF9F5" strokeWidth="0.6" strokeLinejoin="round" /><polygon points="-2.2,20.9 0.0,22.1 0.0,-14.3 -2.2,-15.5" fill="#3A4552" stroke="#3A4552" strokeWidth="0.6" strokeLinejoin="round" /><polygon points="2.2,20.9 0.0,22.1 0.0,-14.3 2.2,-15.5" fill="#2C3540" stroke="#2C3540" strokeWidth="0.6" strokeLinejoin="round" /><polygon points="0.0,-16.8 2.2,-15.5 0.0,-14.3 -2.2,-15.5" fill="#5B6470" stroke="#5B6470" strokeWidth="0.6" strokeLinejoin="round" /><polygon points="-6.7,-17.1 3.0,-11.6 3.0,-13.2 -6.7,-18.8" fill="#3A4552" stroke="#3A4552" strokeWidth="0.6" strokeLinejoin="round" /><polygon points="6.1,-13.3 3.0,-11.6 3.0,-13.2 6.1,-15.0" fill="#2C3540" stroke="#2C3540" strokeWidth="0.6" strokeLinejoin="round" /><polygon points="-3.6,-20.6 6.1,-15.0 3.0,-13.2 -6.7,-18.8" fill="#5B6470" stroke="#5B6470" strokeWidth="0.6" strokeLinejoin="round" /><circle cx="-3.6" cy="-16.1" r="3.9" fill="#D9A13A" /><circle cx="-4.8" cy="-17.3" r="1.8" fill="#EDC36A" />
      </>
    ),
  },
  C: {
    viewBox: '-42.4 -22.5 84.7 74.7',
    body: (
      <>
        <polygon points="-36.4,25.2 0.0,46.2 0.0,42.0 -36.4,21.0" fill="#E2DCCD" stroke="#E2DCCD" strokeWidth="0.6" strokeLinejoin="round" /><polygon points="36.4,25.2 0.0,46.2 0.0,42.0 36.4,21.0" fill="#CEC6B4" stroke="#CEC6B4" strokeWidth="0.6" strokeLinejoin="round" /><polygon points="0.0,0.0 36.4,21.0 0.0,42.0 -36.4,21.0" fill="#F1ECE1" stroke="#F1ECE1" strokeWidth="0.6" strokeLinejoin="round" /><polygon points="-6.1,34.3 -2.4,36.4 -2.4,32.2 -6.1,30.1" fill="#8DB7D4" stroke="#8DB7D4" strokeWidth="0.6" strokeLinejoin="round" /><polygon points="25.5,20.3 -2.4,36.4 -2.4,32.2 25.5,16.1" fill="#6E9DBE" stroke="#6E9DBE" strokeWidth="0.6" strokeLinejoin="round" /><polygon points="21.8,14.0 25.5,16.1 -2.4,32.2 -6.1,30.1" fill="#BFD8E9" stroke="#BFD8E9" strokeWidth="0.6" strokeLinejoin="round" /><polygon points="-19.4,15.4 0.0,26.6 0.0,7.0 -19.4,-4.2" fill="#E8E4DA" stroke="#E8E4DA" strokeWidth="0.6" strokeLinejoin="round" /><polygon points="19.4,15.4 0.0,26.6 0.0,7.0 19.4,-4.2" fill="#D3CDBF" stroke="#D3CDBF" strokeWidth="0.6" strokeLinejoin="round" /><polygon points="0.0,-15.4 19.4,-4.2 0.0,7.0 -19.4,-4.2" fill="#FFFFFF" stroke="#FFFFFF" strokeWidth="0.6" strokeLinejoin="round" /><polygon points="-19.4,-4.2 0.0,7.0 0.0,5.9 -19.4,-5.3" fill="#0B5C8C" stroke="#0B5C8C" strokeWidth="0.6" strokeLinejoin="round" /><polygon points="19.4,-4.2 0.0,7.0 0.0,5.9 19.4,-5.3" fill="#084A71" stroke="#084A71" strokeWidth="0.6" strokeLinejoin="round" /><polygon points="0.0,-16.5 19.4,-5.3 0.0,5.9 -19.4,-5.3" fill="#6FA8CF" stroke="#6FA8CF" strokeWidth="0.6" strokeLinejoin="round" /><polygon points="-6.1,34.3 -2.4,36.4 -2.4,23.8 -6.1,21.7" fill="#8DB7D4" stroke="#8DB7D4" strokeWidth="0.6" strokeLinejoin="round" /><polygon points="1.2,34.3 -2.4,36.4 -2.4,23.8 1.2,21.7" fill="#6E9DBE" stroke="#6E9DBE" strokeWidth="0.6" strokeLinejoin="round" /><polygon points="-2.4,19.6 1.2,21.7 -2.4,23.8 -6.1,21.7" fill="#BFD8E9" stroke="#BFD8E9" strokeWidth="0.6" strokeLinejoin="round" />
      </>
    ),
  },
};

export function IsoIcon({ dir, size = 40 }: { dir: DirCode; size?: number }) {
  const icon = ICONS[dir];
  const [, , w = 1, h = 1] = icon.viewBox.split(' ').map(Number);
  return (
    <svg width={size} height={Math.round((size * h) / w)} viewBox={icon.viewBox} aria-hidden="true" className="iso-icon">
      {icon.body}
    </svg>
  );
}
