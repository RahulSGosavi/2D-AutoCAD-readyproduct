import Konva from 'konva';
import { SnapIndex } from '../lib/snap-utils';
import {
  registerKonvaObjectToIndex,
  updateKonvaObjectInIndex,
  unregisterKonvaObjectFromIndex,
} from '../lib/konva-entity-adapter';

const trackedEvents = ['dragmove', 'transform', 'scale', 'pointsChange'];

const debounce = <T extends (...args: never[]) => void>(fn: T, delay = 16) => {
  let frame: number | null = null;
  return (...args: Parameters<T>) => {
    if (frame) cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => fn(...args));
  };
};

const attachListenersToNode = (node: Konva.Node, index: SnapIndex) => {
  if (!(node instanceof Konva.Shape)) return;
  const update = debounce(() => updateKonvaObjectInIndex(node, index));
  trackedEvents.forEach((evt) => node.on(evt, update));
  node.on('destroy', () => unregisterKonvaObjectFromIndex(node, index));
  registerKonvaObjectToIndex(node, index);
};

export function initializeIndexWithStage(stage: Konva.Stage, index: SnapIndex) {
  index.clear();
  stage.find('Shape').forEach((node) => {
    if (node instanceof Konva.Shape) {
      registerKonvaObjectToIndex(node, index);
    }
  });
}

export function attachIndexAutoUpdate(stage: Konva.Stage, index: SnapIndex) {
  initializeIndexWithStage(stage, index);
  stage.find('Shape').forEach((node) => attachListenersToNode(node, index));

  stage.on('childadded', (evt) => {
    const target = evt.target;
    if (!target) return;
    target.find('Shape').forEach((node) => attachListenersToNode(node, index));
  });
}

