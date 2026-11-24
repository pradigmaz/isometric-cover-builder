import React from 'react';
import { IsometricCanvas } from './IsometricCanvas';

/**
 * CanvasViewport component alias for IsometricCanvas.
 * Ensures the 9:16 and standard format covers are framed boldly and prominently in the viewport.
 */
export const CanvasViewport: React.FC = () => {
  return <IsometricCanvas />;
};

export default CanvasViewport;
export { IsometricCanvas };
