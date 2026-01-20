export type DomInsertTarget = {
  beforeAppId: string | null;
  end: boolean;
};

function getCardId(el: Element): string | null {
  const id = el.getAttribute("data-app-id");
  return id && id.trim() ? id : null;
}

export function computeInsertTargetFromGrid(opts: {
  root: HTMLElement;
  x: number;
  y: number;
  excludeAppId?: string | null;
}): DomInsertTarget {
  const nodes = Array.from(opts.root.querySelectorAll("[data-app-id]"));
  const cards = nodes
    .map((n) => {
      const id = getCardId(n);
      if (!id) return null;
      if (opts.excludeAppId && id === opts.excludeAppId) return null;
      const rect = (n as HTMLElement).getBoundingClientRect();
      return {
        id,
        rect,
        cx: rect.left + rect.width / 2,
        cy: rect.top + rect.height / 2,
      };
    })
    .filter((v): v is NonNullable<typeof v> => !!v);

  if (cards.length === 0) return { beforeAppId: null, end: true };

  let nearestIndex = 0;
  let nearestDist = Number.POSITIVE_INFINITY;
  for (let i = 0; i < cards.length; i++) {
    const c = cards[i]!;
    const dx = opts.x - c.cx;
    const dy = opts.y - c.cy;
    const d = dx * dx + dy * dy;
    if (d < nearestDist) {
      nearestDist = d;
      nearestIndex = i;
    }
  }

  const nearest = cards[nearestIndex]!;
  const sameRow = Math.abs(opts.y - nearest.cy) < nearest.rect.height * 0.55;
  const before = sameRow ? opts.x < nearest.cx : opts.y < nearest.cy;
  const insertPos = nearestIndex + (before ? 0 : 1);

  if (insertPos >= cards.length) return { beforeAppId: null, end: true };
  return { beforeAppId: cards[insertPos]!.id, end: false };
}

