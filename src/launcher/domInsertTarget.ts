export type DomInsertTarget = {
  beforeAppId: string | null;
  end: boolean;
};

export type GridCardRect = {
  id: string;
  rect: DOMRect;
};

function getCardId(el: Element): string | null {
  const id = el.getAttribute("data-app-id");
  return id && id.trim() ? id : null;
}

function toCardRect(el: Element, excludeAppId?: string | null): GridCardRect | null {
  const id = getCardId(el);
  if (!id) return null;
  if (excludeAppId && id === excludeAppId) return null;
  return {
    id,
    rect: (el as HTMLElement).getBoundingClientRect(),
  };
}

export function collectGridCardRects(opts: {
  root: HTMLElement;
  excludeAppId?: string | null;
}): GridCardRect[] {
  return Array.from(opts.root.querySelectorAll("[data-app-id]"))
    .map((el) => toCardRect(el, opts.excludeAppId))
    .filter((item): item is GridCardRect => !!item);
}

type NormalizedCard = GridCardRect & {
  cx: number;
  cy: number;
};

export function computeInsertTargetFromCards(opts: {
  cards: GridCardRect[];
  x: number;
  y: number;
}): DomInsertTarget {
  const cards = opts.cards.map((card) => ({
    ...card,
    cx: card.rect.left + card.rect.width / 2,
    cy: card.rect.top + card.rect.height / 2,
  }));

  if (cards.length === 0) return { beforeAppId: null, end: true };

  const sorted = cards.slice().sort((a, b) => {
    const dy = a.rect.top - b.rect.top;
    if (Math.abs(dy) > 8) return dy;
    return a.rect.left - b.rect.left;
  });

  const avgHeight = sorted.reduce((sum, card) => sum + card.rect.height, 0) / sorted.length;
  const rowTolerance = Math.max(6, avgHeight * 0.4);

  const rows: NormalizedCard[][] = [];
  for (const card of sorted) {
    const row = rows[rows.length - 1];
    if (!row) {
      rows.push([card]);
      continue;
    }
    const rowTop = row[0]!.rect.top;
    if (Math.abs(card.rect.top - rowTop) <= rowTolerance) {
      row.push(card);
    } else {
      rows.push([card]);
    }
  }

  for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
    const row = rows[rowIndex]!;
    row.sort((a, b) => a.rect.left - b.rect.left);

    const first = row[0]!;
    const rowTop = Math.min(...row.map((card) => card.rect.top));
    const rowBottom = Math.max(...row.map((card) => card.rect.bottom));
    const rowBandTop = rowTop - rowTolerance;
    const rowBandBottom = rowBottom + rowTolerance;

    if (opts.y < rowBandTop) return { beforeAppId: first.id, end: false };
    if (opts.y > rowBandBottom) continue;

    for (const card of row) {
      if (opts.x < card.cx) return { beforeAppId: card.id, end: false };
    }

    const nextRow = rows[rowIndex + 1];
    if (!nextRow) return { beforeAppId: null, end: true };
    return { beforeAppId: nextRow[0]!.id, end: false };
  }

  return { beforeAppId: null, end: true };
}

export function computeInsertTargetFromGrid(opts: {
  root: HTMLElement;
  x: number;
  y: number;
  excludeAppId?: string | null;
}): DomInsertTarget {
  const cards = collectGridCardRects({
    root: opts.root,
    excludeAppId: opts.excludeAppId,
  });
  return computeInsertTargetFromCards({
    cards,
    x: opts.x,
    y: opts.y,
  });
}

