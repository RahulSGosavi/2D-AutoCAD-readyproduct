import { nanoid } from 'nanoid';
import type { EditorElement } from '../state/useEditorStore';
import type { Point } from '../utils/math-utils';

export interface TextElement extends EditorElement {
  type: 'text';
  text: string;
  fontSize: number;
  fontFamily: string;
  align: 'left' | 'center' | 'right';
  verticalAlign: 'top' | 'middle' | 'bottom';
}

export const createTextElement = (
  position: Point,
  text: string,
  layerId: string,
  fontSize: number = 16,
  fontFamily: string = 'Arial',
  align: 'left' | 'center' | 'right' = 'left',
  verticalAlign: 'top' | 'middle' | 'bottom' = 'middle',
): any => {
  return {
    id: nanoid(),
    type: 'text',
    layerId,
    text,
    fontSize,
    fontFamily,
    align,
    verticalAlign,
    stroke: '#000000', // Text color - defaults to black
    strokeWidth: 0, // No stroke outline
    fill: undefined, // No background fill
    opacity: 1,
    rotation: 0,
    x: position.x,
    y: position.y,
    width: 0,
    height: 0,
  };
};

