import nodemailer from "nodemailer";

/**
 * Сервис для отправки email
 */

// Настройка SMTP транспорта
// Поддерживает Gmail, Mail.ru, Yandex, Outlook и любые другие SMTP серверы
const createTransporter = () => {
  // Используйте переменные окружения для настройки
  const email = process.env.SMTP_EMAIL;
  const password = process.env.SMTP_PASSWORD;
  const service = process.env.SMTP_SERVICE || "gmail";
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : undefined;
  const secure = process.env.SMTP_SECURE === "true";

  if (!email || !password) {
    throw new Error("SMTP credentials not configured. Set SMTP_EMAIL and SMTP_PASSWORD in .env");
  }

  // Если указан host, используем универсальную настройку SMTP
  if (host) {
    return nodemailer.createTransport({
      host,
      port: port || 465,
      secure: secure !== undefined ? secure : (port === 465 || port === 587),
      auth: {
        user: email,
        pass: password,
      },
    });
  }

  // Если указан только service (для Gmail и других популярных сервисов)
  // Nodemailer автоматически определит настройки
  return nodemailer.createTransport({
    service,
    auth: {
      user: email,
      pass: password, // Для Gmail используйте пароль приложения, не обычный пароль
    },
  });
};

/**
 * Отправить код подтверждения на email
 */
export async function sendVerificationCodeEmail(
  to: string,
  code: string,
): Promise<void> {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: process.env.SMTP_EMAIL || "noreply@scanimg.com",
      to,
      subject: "Код подтверждения email - ScanImg",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Код подтверждения email</h2>
          <p>Здравствуйте!</p>
          <p>Ваш код подтверждения email:</p>
          <div style="background-color: #f5f5f5; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px;">
            <h1 style="color: #007bff; font-size: 32px; margin: 0; letter-spacing: 8px;">${code}</h1>
          </div>
          <p>Код действителен в течение <strong>10 минут</strong>.</p>
          <p>Если вы не запрашивали этот код, проигнорируйте это письмо.</p>
          <p>Спасибо,<br>Команда ScanImg</p>
        </div>
      `,
      text: `Ваш код подтверждения: ${code}\n\nКод действителен в течение 10 минут.`,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Verification code sent to ${to}`);
  } catch (error) {
    console.error("Error sending verification code email:", error);
    throw new Error("Не удалось отправить код на email");
  }
}

/**
 * Отправить уведомление об обратной связи администратору
 */
export async function sendFeedbackEmail(
  subject: string,
  message: string,
  userEmail?: string,
  userId?: string
): Promise<void> {
  try {
    const adminEmail = process.env.ADMIN_EMAIL;
    if (!adminEmail) {
      console.warn("ADMIN_EMAIL not configured, skipping feedback email");
      return;
    }

    const transporter = createTransporter();

    const mailOptions = {
      from: process.env.SMTP_EMAIL || "noreply@scanimg.com",
      to: adminEmail,
      subject: `[Feedback] ${subject}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Новое сообщение обратной связи</h2>
          <p><strong>Тема:</strong> ${subject}</p>
          <p><strong>От кого:</strong> ${userEmail || "Аноним"} ${userId ? `(ID: ${userId})` : ""}</p>
          <div style="background-color: #f5f5f5; padding: 20px; margin: 20px 0; border-radius: 8px;">
            <p style="white-space: pre-wrap;">${message}</p>
          </div>
          <p>Это автоматическое уведомление от ScanImg Backend.</p>
        </div>
      `,
      text: `Тема: ${subject}\nОт кого: ${userEmail || "Аноним"} ${userId ? `(ID: ${userId})` : ""}\n\n${message}`,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Feedback email sent to ${adminEmail}`);
  } catch (error) {
    console.error("Error sending feedback email:", error);
    // Не выбрасываем ошибку, чтобы не блокировать сохранение в БД
  }
}

