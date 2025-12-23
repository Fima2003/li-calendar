export enum Status {
  CHOOSE_TOPIC = "Choose Topic",
  THINK_OF_TEXT = "Think of text",
  POLISH_TEXT = "Polish text",
  SCHEDULE = "Schedule",
  POST = "Post",
}

export enum PostFormat {
  SCREENSHOT = "Screenshot",
  INFOGRAPHIC = "Infographic",
  TEXT_POST = "Text post",
  CAROUSEL = "Carousel",
  VIDEO = "Video",
}

export enum PostRule {
  RULE_70 = "70%",
  RULE_20 = "20%",
  RULE_10 = "10%",
}

export interface DayData {
  date: string; // ISO date string YYYY-MM-DD
  status: Status;
  topic?: string;
  notes?: string; // For "Think of text" sketches
  finalText?: string; // For "Polish text" and onwards
  format?: PostFormat;
  rule?: PostRule;
}

export interface CalendarMonthData {
  [date: string]: DayData;
}
