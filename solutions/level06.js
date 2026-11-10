export const solution = `for (let y = 0; y < GRID_HEIGHT; y++) {
  for (let x = 0; x < GRID_WIDTH; x++) {
    if ((x + y) % 2 === 0) {
      goTo(x, y);
      plant();
    }
  }
}`;
