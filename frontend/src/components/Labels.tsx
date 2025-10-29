export function Labels({ xLabels }: { xLabels?: boolean }) {
  if (xLabels) {
    return (
      <div className="board-labels x-labels">
        <div>0</div>
        <div>1</div>
        <div>2</div>
        <div>3</div>
        <div>4</div>
      </div>
    );
  } else {
    return (
      <div className="board-labels y-labels">
        <div>A</div>
        <div>B</div>
        <div>C</div>
        <div>D</div>
        <div>E</div>
      </div>
    );
  }
}
