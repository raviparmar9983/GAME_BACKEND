import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { EmailDTO } from '@dtos';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;
  private readonly logger = new Logger(EmailService.name);
  private readonly fromName: string;

  constructor(private configService: ConfigService) {
    const smtpPassword = this.configService.get('SMTP_PASSWORD');
    const smtpHost = this.configService.get('SMTP_HOST');
    const smtpEmail = this.configService.get('SMTP_USER');
    const smtpPort = this.configService.get('SMTP_PORT');

    this.transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      auth: {
        user: smtpEmail,
        pass: smtpPassword,
      },
    });

    this.fromName = smtpEmail;
  }

  async sendEmail(option: EmailDTO): Promise<boolean> {
    const email = {
      ...option.content,
      to: option.to,
      from: this.fromName,
    };

    try {
      await this.transporter.sendMail(email);
      return true;
    } catch (err) {
      this.logger.error('Error in sending email', err);
      return false;
    }
  }
}
