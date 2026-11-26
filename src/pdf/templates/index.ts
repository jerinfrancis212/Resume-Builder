import Classic from './Classic';
import ModernMinimal from './ModernMinimal';
import Executive from './Executive';
import AtsFriendly from './AtsFriendly';
import TwoColumn from './TwoColumn';
import Graduate from './Graduate';
import Creative from './Creative';
import Elegant from './Elegant';
import Technical from './Technical';
import Academic from './Academic';
import International from './International';
import BlackAndWhite from './BlackAndWhite';
import Europass from './Europass';
import type { TemplateComponent } from './types';

/** Maps all 13 template ids (see src/templates/meta.ts) to their react-pdf components. */
export const TEMPLATE_COMPONENTS: Record<string, TemplateComponent> = {
  europass: Europass,
  classic: Classic,
  'modern-minimal': ModernMinimal,
  executive: Executive,
  ats: AtsFriendly,
  'two-column': TwoColumn,
  graduate: Graduate,
  creative: Creative,
  elegant: Elegant,
  technical: Technical,
  academic: Academic,
  international: International,
  bw: BlackAndWhite,
};
