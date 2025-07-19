const verificationEmail = (link: string) => {
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>{{title}}</title>
    <style>
      body {
        margin: 0;
        padding: 0;
        background-color: #0f0f0f;
        font-family: 'Inter', Helvetica, sans-serif;
        color: #ffffff;
      }

      .container {
        max-width: 600px;
        margin: auto;
        padding: 40px 30px;
        background-color: #1c1c1e;
        border-radius: 16px;
        box-shadow: 0 0 10px rgba(255, 255, 255, 0.05);
      }

      .title {
        font-size: 28px;
        font-weight: 700;
        color: #ffffff;
        margin-bottom: 20px;
      }

      .message {
        font-size: 16px;
        color: #d1d1d1;
        line-height: 1.6;
      }

      .button {
        display: inline-block;
        margin-top: 30px;
        padding: 14px 30px;
        background: linear-gradient(90deg, #00c6ff, #0072ff);
        color: #ffffff;
        font-weight: 600;
        font-size: 15px;
        text-decoration: none;
        border-radius: 8px;
        letter-spacing: 0.5px;
      }

      .footer {
        margin-top: 40px;
        font-size: 12px;
        color: #888;
        text-align: center;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="title">{{title}}</div>
      <div class="message">
        You're almost there! Click the button below to verify your email and complete your registration.
      </div>
      <a href=${link} class="button">Verify Email</a>
      <div class="footer">
        If you didn’t request this, feel free to ignore this email.
      </div>
    </div>
  </body>
</html>
`;
};

export { verificationEmail };
