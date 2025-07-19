export interface EmailContent {
  subject: string;
  text?: string;
  html?: string;
}

export interface EmailContacts {
  to: string[];
  from: string;
}

export interface EmailDTO {
  to: string[];
  bcc?: string[];
  content: EmailContent;
}

export interface EmailTokenDTO {
  token: string;
  userId: string;
}
