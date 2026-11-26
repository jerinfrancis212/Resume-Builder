import {
  DndContext,
  PointerSensor,
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
import {
  Award,
  Briefcase,
  Eye,
  EyeOff,
  FileText,
  FolderGit2,
  Globe,
  GraduationCap,
  GripVertical,
  LayoutTemplate,
  Palette,
  Plus,
  Sparkles,
  User,
  Wrench,
} from 'lucide-react';
import type { AdditionalSectionType, ResumeData, SectionKey } from '@/types/resume';
import { ADDITIONAL_SECTION_META, CORE_SECTION_LABELS, isExtraKey } from '@/lib/resume/sections';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/controls';
import { cn } from '@/lib/utils';

export type EditorTab = 'personal' | SectionKey | 'customize' | 'templates';

const CORE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  summary: FileText,
  experience: Briefcase,
  education: GraduationCap,
  skills: Wrench,
  projects: FolderGit2,
  certifications: Award,
  languages: Globe,
};

interface SortableSectionRowProps {
  id: SectionKey;
  label: string;
  active: boolean;
  hidden: boolean;
  onSelect: () => void;
  onToggleHidden: () => void;
}

function SortableSectionRow({ id, label, active, hidden, onSelect, onToggleHidden }: SortableSectionRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const Icon = isExtraKey(id) ? Sparkles : CORE_ICONS[id] ?? FileText;

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        'group flex items-center gap-1 rounded-lg px-1.5 py-1.5 text-sm transition-colors',
        active ? 'bg-primary/10 text-primary font-medium' : 'text-foreground/80 hover:bg-secondary/80',
        hidden && 'opacity-55',
        isDragging && 'z-20 bg-background shadow-lift ring-1 ring-border',
      )}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="cursor-grab touch-none rounded p-1 text-muted-foreground/60 hover:text-foreground active:cursor-grabbing"
        aria-label={`Reorder ${label}`}
      >
        <GripVertical className="h-3.5 w-3.5" />
      </button>

      <button type="button" onClick={onSelect} className="flex flex-1 items-center gap-2 text-left min-w-0 py-0.5">
        <Icon className="h-4 w-4 shrink-0 opacity-80" />
        <span className="truncate text-[13px]">{label}</span>
      </button>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onToggleHidden();
        }}
        title={hidden ? 'Show section on resume' : 'Hide section from resume'}
        className="rounded p-1 text-muted-foreground/70 opacity-70 hover:bg-background hover:text-foreground group-hover:opacity-100"
      >
        {hidden ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
      </button>
    </div>
  );
}

interface SectionSidebarProps {
  data: ResumeData;
  activeTab: EditorTab;
  onSelectTab: (tab: EditorTab) => void;
  onReorder: (order: SectionKey[]) => void;
  onToggleHidden: (key: SectionKey) => void;
  onAddAdditional: (type: AdditionalSectionType) => void;
}

export function SectionSidebar({
  data,
  activeTab,
  onSelectTab,
  onReorder,
  onToggleHidden,
  onAddAdditional,
}: SectionSidebarProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
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
      const sec = data.additional.find((s) => `extra:${s.id}` === key);
      return sec?.title || 'Custom Section';
    }
    return CORE_SECTION_LABELS[key];
  };

  return (
    <aside className="flex h-full flex-col border-r border-border bg-background">
      <div className="flex-1 overflow-y-auto thin-scroll p-3 space-y-4">
        {/* Design shortcuts */}
        <div className="grid grid-cols-2 gap-1.5">
          <button
            type="button"
            onClick={() => onSelectTab('templates')}
            className={cn(
              'flex items-center justify-center gap-1.5 rounded-lg border px-2.5 py-2 text-xs font-medium transition-colors',
              activeTab === 'templates'
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border bg-background text-muted-foreground hover:bg-secondary hover:text-foreground',
            )}
          >
            <LayoutTemplate className="h-3.5 w-3.5" />
            Templates
          </button>
          <button
            type="button"
            onClick={() => onSelectTab('customize')}
            className={cn(
              'flex items-center justify-center gap-1.5 rounded-lg border px-2.5 py-2 text-xs font-medium transition-colors',
              activeTab === 'customize'
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border bg-background text-muted-foreground hover:bg-secondary hover:text-foreground',
            )}
          >
            <Palette className="h-3.5 w-3.5" />
            Customize
          </button>
        </div>

        {/* Personal info (pinned) */}
        <div>
          <p className="px-2 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Header
          </p>
          <button
            type="button"
            onClick={() => onSelectTab('personal')}
            className={cn(
              'flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] transition-colors',
              activeTab === 'personal'
                ? 'bg-primary/10 text-primary font-medium'
                : 'text-foreground/80 hover:bg-secondary/80',
            )}
          >
            <User className="h-4 w-4 shrink-0" />
            Personal Information
          </button>
        </div>

        {/* Sortable body sections */}
        <div>
          <div className="flex items-center justify-between px-2 pb-1.5">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Sections
            </p>
            <span className="text-[10px] text-muted-foreground/80">Drag to reorder</span>
          </div>

          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={data.sectionOrder} strategy={verticalListSortingStrategy}>
              <div className="space-y-0.5">
                {data.sectionOrder.map((key) => (
                  <SortableSectionRow
                    key={key}
                    id={key}
                    label={labelFor(key)}
                    active={activeTab === key}
                    hidden={data.hiddenSections.includes(key)}
                    onSelect={() => onSelectTab(key)}
                    onToggleHidden={() => onToggleHidden(key)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      </div>

      {/* Add optional section */}
      <div className="border-t border-border p-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="w-full justify-center">
              <Plus className="h-4 w-4" />
              Add Section
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            {(Object.keys(ADDITIONAL_SECTION_META) as AdditionalSectionType[]).map((type) => (
              <DropdownMenuItem key={type} onClick={() => onAddAdditional(type)}>
                <Plus className="h-3.5 w-3.5 text-muted-foreground" />
                {ADDITIONAL_SECTION_META[type].label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  );
}
