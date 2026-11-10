export const solution = `function tend(x, y) {
  goTo(x, y);
  plant();
  water();
  harvest();
}

for (let y = 0; y < GRID_HEIGHT; y++) {
  for (let x = 0; x < GRID_WIDTH; x++) {
    if (!isRock(x, y)) {
      tend(x, y);
    }
  }
}`;
