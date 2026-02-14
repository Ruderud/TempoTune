export type HeadstockLayout = 'three-plus-three' | 'six-inline';

export type AnchorPoint = {
  x: number;
  y: number;
  side: 'left' | 'right';
};

export type HeadstockLayoutSpec = {
  imageSrc: string;
  imageAlt: string;
  anchors: AnchorPoint[];
  stringToAnchorMap: number[];
  buttonSizePx: number;
  maxWidthPx: number;
  aspectRatio: number;
};

export const HEADSTOCK_LAYOUTS: Record<HeadstockLayout, HeadstockLayoutSpec> = {
  'three-plus-three': {
    imageSrc: '/images/tuner/headstock-3-plus-3.png',
    imageAlt: '3+3 기타 헤드스톡',
    anchors: [
      { x: 0.15, y: 0.33, side: 'left' },
      { x: 0.15, y: 0.40, side: 'left' },
      { x: 0.15, y: 0.47, side: 'left' },
      { x: 0.85, y: 0.33, side: 'right' },
      { x: 0.85, y: 0.40, side: 'right' },
      { x: 0.85, y: 0.47, side: 'right' },
    ],
    stringToAnchorMap: [0, 1, 2, 3, 4, 5],
    buttonSizePx: 44,
    maxWidthPx: 280,
    aspectRatio: 2 / 3,
  },
  'six-inline': {
    imageSrc: '/images/tuner/headstock-6-inline.png',
    imageAlt: '6-인라인 기타 헤드스톡',
    anchors: [
      { x: 0.16, y: 0.26, side: 'left' },
      { x: 0.16, y: 0.33, side: 'left' },
      { x: 0.16, y: 0.40, side: 'left' },
      { x: 0.16, y: 0.47, side: 'left' },
      { x: 0.16, y: 0.54, side: 'left' },
      { x: 0.16, y: 0.61, side: 'left' },
    ],
    stringToAnchorMap: [0, 1, 2, 3, 4, 5],
    buttonSizePx: 44,
    maxWidthPx: 280,
    aspectRatio: 2 / 3,
  },
};

export function getLayoutSpec(layout: HeadstockLayout): HeadstockLayoutSpec {
  return HEADSTOCK_LAYOUTS[layout];
}
