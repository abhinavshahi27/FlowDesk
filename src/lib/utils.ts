import { format, formatDistanceToNow, isAfter, parseISO } from 'date-fns';
import type { TaskPriority, TaskStatus } from './database.types';

export function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0].toUpperCase())
    .join('');
}

const AVATAR_COLORS = [
  '#22D3EE', '#34D399', '#FBBF24', '#F87171', '#A78BFA',
  '#F472B6', '#60A5FA', '#A3E635', '#FB923C', '#818CF8',
];

export function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export function formatDate(dateStr: string | null): string {
  if (!dateStr) return '';
  try {
    return format(parseISO(dateStr), 'MMM d, yyyy');
  } catch {
    return dateStr;
  }
}

export function formatRelative(dateStr: string): string {
  try {
    return formatDistanceToNow(parseISO(dateStr), { addSuffix: true });
  } catch {
    return '';
  }
}

export function isOverdue(dateStr: string | null): boolean {
  if (!dateStr) return false;
  try {
    return isAfter(new Date(), parseISO(dateStr));
  } catch {
    return false;
  }
}

export const PRIORITY_CONFIG: Record<
  TaskPriority,
  { label: string; text: string; bg: string; dot: string; ring: string }
> = {
  low: {
    label: 'Low',
    text: 'text-muted',
    bg: 'bg-surface-2',
    dot: 'bg-muted',
    ring: 'ring-border',
  },
  medium: {
    label: 'Medium',
    text: 'text-accent',
    bg: 'bg-accent/10',
    dot: 'bg-accent',
    ring: 'ring-accent/30',
  },
  high: {
    label: 'High',
    text: 'text-warning',
    bg: 'bg-warning/10',
    dot: 'bg-warning',
    ring: 'ring-warning/30',
  },
  urgent: {
    label: 'Urgent',
    text: 'text-danger',
    bg: 'bg-danger/10',
    dot: 'bg-danger',
    ring: 'ring-danger/30',
  },
};

export const STATUS_CONFIG: Record<
  TaskStatus,
  { label: string; text: string; bg: string; border: string; accent: string }
> = {
  backlog: {
    label: 'Backlog',
    text: 'text-muted',
    bg: 'bg-surface-2',
    border: 'border-border',
    accent: 'bg-muted',
  },
  todo: {
    label: 'To Do',
    text: 'text-ink',
    bg: 'bg-surface',
    border: 'border-border',
    accent: 'bg-accent-2',
  },
  in_progress: {
    label: 'In Progress',
    text: 'text-accent',
    bg: 'bg-accent/10',
    border: 'border-accent/30',
    accent: 'bg-accent',
  },
  review: {
    label: 'Review',
    text: 'text-warning',
    bg: 'bg-warning/10',
    border: 'border-warning/30',
    accent: 'bg-warning',
  },
  done: {
    label: 'Done',
    text: 'text-success',
    bg: 'bg-success/10',
    border: 'border-success/30',
    accent: 'bg-success',
  },
};

export const TASK_STATUSES: TaskStatus[] = ['backlog', 'todo', 'in_progress', 'review', 'done'];
export const WORKFLOW_STATUSES: TaskStatus[] = ['todo', 'in_progress', 'done'];

export function normalizeWorkflowStatus(status: TaskStatus): TaskStatus {
  if (status === 'backlog') return 'todo';
  if (status === 'review') return 'in_progress';
  return status;
}

export const PROJECT_COLORS = [
  '#22D3EE', '#34D399', '#FBBF24', '#F87171', '#F472B6',
  '#60A5FA', '#A3E635', '#FB923C', '#A78BFA', '#2DD4BF',
];

export function clsx(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

export const PRODUCTIVITY_TIPS: string[] = [
  'Group sprint work into focused 90-minute blocks for deeper output.',
  'Break large initiatives into 3-5 day milestones to keep momentum.',
  'Use tags like roadmap, bug, or research to filter your task board fast.',
  'Review the Overdue column every Monday so nothing slips through.',
  'Move tasks to In Progress only when you actively start working on them.',
];

export const SAMPLE_WORKSPACES: { label: string; description: string; color: string }[] = [
  { label: 'Product Launch Q3', description: '12 active tasks · 5 collaborators', color: '#22D3EE' },
  { label: 'Brand Refresh', description: '4 in progress · 2 reviewing', color: '#F472B6' },
  { label: 'Customer Research', description: '8 backlog · 1 due Friday', color: '#A78BFA' },
];

export const ONBOARDING_STEPS: { title: string; description: string }[] = [
  { title: 'Create a workspace', description: 'Spin up a project and pick a color identifier.' },
  { title: 'Invite teammates', description: 'Add admins and members by email — RLS handles the rest.' },
  { title: 'Plan your board', description: 'Drag tasks across To Do, In Progress, and Done.' },
];

export interface SampleProject {
  name: string;
  description: string;
  color: string;
  task_count: number;
  completed_count: number;
  member_count: number;
  updatedHint: string;
  tags: string[];
}

export const SAMPLE_DASHBOARD_PROJECTS: SampleProject[] = [
  {
    name: 'Product Launch Q3',
    description: 'Coordinate marketing, engineering, and support for the autumn release.',
    color: '#22D3EE',
    task_count: 28,
    completed_count: 17,
    member_count: 6,
    updatedHint: 'Updated 2 hours ago',
    tags: ['launch', 'roadmap'],
  },
  {
    name: 'Brand Refresh',
    description: 'New visual identity, typography, and homepage refresh for v3.',
    color: '#F472B6',
    task_count: 14,
    completed_count: 9,
    member_count: 4,
    updatedHint: 'Updated yesterday',
    tags: ['design', 'brand'],
  },
  {
    name: 'Customer Research',
    description: 'Discovery interviews and survey synthesis for the SMB segment.',
    color: '#A78BFA',
    task_count: 12,
    completed_count: 3,
    member_count: 3,
    updatedHint: 'Updated 3 days ago',
    tags: ['research', 'discovery'],
  },
  {
    name: 'Mobile App v2',
    description: 'Rewrite the mobile shell with offline support and push notifications.',
    color: '#FB923C',
    task_count: 22,
    completed_count: 6,
    member_count: 5,
    updatedHint: 'Updated 5 hours ago',
    tags: ['mobile', 'engineering'],
  },
];

export const SAMPLE_TEAMMATES: { name: string; tasks: number }[] = [
  { name: 'Priya Shah', tasks: 9 },
  { name: 'Marcus Lee', tasks: 7 },
  { name: 'Avery Chen', tasks: 5 },
  { name: 'Jordan Pope', tasks: 4 },
];
