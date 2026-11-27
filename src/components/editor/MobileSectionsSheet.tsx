import {
  DndContext,
  PointerSensor,
  TouchSensor,
  KeyboardSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Eye, EyeOff, GripVertical, ArrowUpDown } from 'lucide-react';
import type { ResumeData, SectionKey } from '@/types/resume';
import { CORE_SECTION_LABELS, isExtraKey } from '@/lib/resume/sections';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

function MobileSortableRow({
  id,
  label,
  hidden,
  onSelect,
  onToggleHidden,
}: {
  id: SectionKey;
  label: string;
  hidden: boolean;
  onSelect: () => void;
  onToggleHidden: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        'flex items-center gap-2 rounded-xl border border-border bg-card px-2.5 py-2.5 shadow-soft',
        hidden && 'opacity-55',
        isDragging && 'z-30 shadow-lift ring-2 ring-primary/40 bg-background',
      )}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        aria-label={`Drag to reorder ${label}`}
        className="flex h-9 w-9 shrink-0 cursor-grab touch-none items-center justify-center rounded-lg bg-secondary/70 text-muted-foreground active:cursor-grabbing active:bg-primary/10 active:text-primary"
      >
        <GripVertical className="h-4 w-4" />
      </button>

      <button type="button" onClick={onSelect} className="flex-1 min-w-0 text-left py-1">
        <p className="text-sm font-medium text-foreground truncate">{label}</p>
        <p className="text-[11px] text-muted-foreground">{hidden ? 'Hidden from CV' : 'Visible on CV'}</p>
      </button>

      <button
        type="button"
        onClick={onToggleHidden}
        aria-label={hidden ? `Show ${label}` : `Hide ${label}`}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground"
      >
        {hidden ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}

interface MobileSectionsSheetProps {
  open: boolean;
  onClose: () => void;
  data: ResumeData;
  onReorder: (order: SectionKey[]) => void;
  onToggleHidden: (key: SectionKey) => void;
  onSelectSection: (key: SectionKey) => void;
}

export function MobileSectionsSheet({
  open,
  onClose,
  data,
  onReorder,
  onToggleHidden,
  onSelectSection,
}: MobileSectionsSheetProps) {
  const sensors = useSensors(
    useSensor(TouchSensor, { activationConstraint: { delay: 100, tolerance: 6 } }),
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = data.sectionOrder.indexOf(active.id as SectionKey);
    const newIndex = data.sectionOrder.indexOf(over.id as SectionKey);
    if (oldIndex !== -1 && newIndex !== -1) {
      onReorder(arrayMove(data.sectionOrder, oldIndex, newIndex));
    }
  };

  const labelFor = (key: SectionKey) => {
    if (isExtraKey(key)) {
      return data.additional.find((s) => `extra:${s.id}` === key)?.title || 'Custom Section';
    }
    return CORE_SECTION_LABELS[key];
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-[420px] max-h-[85dvh] flex flex-col p-0 overflow-hidden gap-0">
        <div className="px-5 pt-5 pb-3 border-b border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <ArrowUpDown className="h-4 w-4 text-primary" />
              Reorder &amp; Manage Sections
            </DialogTitle>
            <DialogDescription className="text-xs">
              Drag the grip handle to reorder how sections appear on your CV, or tap the eye icon to hide a section.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="flex-1 overflow-y-auto thin-scroll p-4 space-y-2 bg-secondary/20">
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={data.sectionOrder} strategy={verticalListSortingStrategy}>
              {data.sectionOrder.map((key) => (
                <MobileSortableRow
                  key={key}
                  id={key}
                  label={labelFor(key)}
                  hidden={data.hiddenSections.includes(key)}
                  onSelect={() => {
                    onSelectSection(key);
                    onClose();
                  }}
                  onToggleHidden={() => onToggleHidden(key)}
                />
              ))}
            </SortableContext>
          </DndContext>
        </div>

        <div className="border-t border-border bg-background px-4 py-3">
          <Button type="button" className="w-full" onClick={onClose}>
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
