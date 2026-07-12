export type NotificationType =
  | "new_message"
  | "homework_submitted"
  | "homework_graded"
  | "schedule_event"
  | "new_lesson"
  | "moderation_action";

export type NotificationActor = {
  id: number;
  name: string;
  avatar: string | null;
};

export type Notification = {
  id: number;
  type: NotificationType;
  title: string;
  body: string;
  link_url: string | null;
  actor: NotificationActor | null;
  payload: Record<string, unknown>;
  is_read: boolean;
  created_at: string;
};

export type NotificationChannelPrefs = {
  in_app: boolean;
  email: boolean;
};

export type NotificationPreferences = Partial<Record<NotificationType, NotificationChannelPrefs>>;

export type Paginated<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};
