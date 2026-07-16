import { Directive, ElementRef, HostListener, Input, OnInit, Renderer2, WritableSignal } from '@angular/core';

type SortDirection = 'asc' | 'desc';

@Directive({
  selector: 'table[appSortableTable]',
  standalone: true,
})
export class SortableTableDirective implements OnInit {
  @Input({ required: true }) sortRows!: WritableSignal<unknown[]>;

  private activeHeader?: HTMLTableCellElement;
  private direction: SortDirection = 'asc';

  constructor(
    private readonly host: ElementRef<HTMLTableElement>,
    private readonly renderer: Renderer2,
  ) {}

  ngOnInit(): void {
    for (const header of this.headers) {
      this.renderer.addClass(header, 'sortable-column');
      this.renderer.setAttribute(header, 'tabindex', '0');
      this.renderer.setAttribute(header, 'role', 'button');
      this.renderer.setAttribute(header, 'aria-sort', 'none');
      this.renderer.setAttribute(header, 'title', 'Trier cette colonne');
    }
  }

  @HostListener('click', ['$event'])
  onClick(event: MouseEvent): void {
    const header = (event.target as HTMLElement).closest<HTMLTableCellElement>('th[data-sort-key]');
    if (header && this.host.nativeElement.contains(header)) this.sort(header);
  }

  @HostListener('keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    const header = (event.target as HTMLElement).closest<HTMLTableCellElement>('th[data-sort-key]');
    if (!header || !this.host.nativeElement.contains(header)) return;
    event.preventDefault();
    this.sort(header);
  }

  private sort(header: HTMLTableCellElement): void {
    const key = header.dataset['sortKey'];
    if (!key) return;

    this.direction = this.activeHeader === header && this.direction === 'asc' ? 'desc' : 'asc';
    for (const item of this.headers) {
      item.classList.remove('sort-asc', 'sort-desc');
      this.renderer.setAttribute(item, 'aria-sort', 'none');
    }

    this.activeHeader = header;
    header.classList.add(this.direction === 'asc' ? 'sort-asc' : 'sort-desc');
    this.renderer.setAttribute(header, 'aria-sort', this.direction === 'asc' ? 'ascending' : 'descending');

    const factor = this.direction === 'asc' ? 1 : -1;
    const sorted = [...this.sortRows()].sort((left, right) =>
      factor * this.compare(this.readPath(left, key), this.readPath(right, key)),
    );
    this.sortRows.set(sorted);
  }

  private get headers(): HTMLTableCellElement[] {
    return Array.from(this.host.nativeElement.querySelectorAll<HTMLTableCellElement>('th[data-sort-key]'));
  }

  private readPath(value: unknown, path: string): unknown {
    return path.split('.').reduce<unknown>((current, part) => {
      if (current === null || current === undefined || typeof current !== 'object') return undefined;
      return (current as Record<string, unknown>)[part];
    }, value);
  }

  private compare(left: unknown, right: unknown): number {
    if (left === right) return 0;
    if (left === null || left === undefined || left === '') return 1;
    if (right === null || right === undefined || right === '') return -1;

    if (typeof left === 'number' && typeof right === 'number') return left - right;
    if (typeof left === 'boolean' && typeof right === 'boolean') return Number(left) - Number(right);

    const leftDate = this.asTimestamp(left);
    const rightDate = this.asTimestamp(right);
    if (leftDate !== null && rightDate !== null) return leftDate - rightDate;

    return String(left).localeCompare(String(right), 'fr', { numeric: true, sensitivity: 'base' });
  }

  private asTimestamp(value: unknown): number | null {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}/.test(value)) return null;
    const timestamp = Date.parse(value);
    return Number.isNaN(timestamp) ? null : timestamp;
  }
}
