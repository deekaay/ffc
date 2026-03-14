/**
 * 3-point piecewise linear interpolation.
 * Replaces numpy.interp(x, [x0, x1, x2], [y0, y1, y2]).
 */
export function interp3(
  x: number,
  xArr: [number, number, number],
  yArr: [number, number, number],
): number {
  if (x <= xArr[0]) return yArr[0]
  if (x >= xArr[2]) return yArr[2]
  if (x <= xArr[1]) {
    const t = (x - xArr[0]) / (xArr[1] - xArr[0])
    return yArr[0] + t * (yArr[1] - yArr[0])
  }
  const t = (x - xArr[1]) / (xArr[2] - xArr[1])
  return yArr[1] + t * (yArr[2] - yArr[1])
}
