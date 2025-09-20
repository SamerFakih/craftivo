<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Project setup

```bash
$ npm install
```

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ npm install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).

---

## Email Sending (Contracts Module)

The contracts feature can send signing invitation emails. The `EmailService` supports three modes:

1. Real SMTP (when all MAIL\_\* env vars are provided)
2. Ethereal test account (auto-created for development when vars are missing) – produces a preview URL in logs instead of delivering to real inboxes
3. Log-only fallback (if initialization fails) – does not attempt delivery

### Environment Variables

Add these (optional) to your `.env` (or deployment secret store):

```
MAIL_HOST=smtp.yourprovider.com
MAIL_PORT=587
MAIL_USER=your_smtp_username
MAIL_PASS=your_smtp_password
MAIL_FROM="Craftivo <no-reply@yourdomain.com>"
APP_BASE_URL=https://your-frontend.example.com
```

If they are omitted an Ethereal account will be created automatically and a preview URL will be logged (looks like: `https://ethereal.email/message/<id>`).

### How Contract Emails Are Triggered

`POST /contracts/:id/send` with body:

```json
{
  "recipients": [
    { "role": "client", "email": "client@example.com" },
    { "role": "freelancer", "email": "freelancer@example.com" }
  ],
  "message": "Please sign at your earliest convenience.",
  "subject": "Project Alpha Contract"
}
```

The server will:

- Create signing tokens (7‑day expiry) per role
- Send one email containing a table of secure links (one per role)
- Log an audit record (`send` action)

### Verifying Email Works

Development (no env vars set):

1. Call the send endpoint.
2. Check console logs for: `Using Ethereal test account ...` then `Contract email sent ... preview=...`.
3. Open the preview URL in a browser to see the rendered email.

Real SMTP:

1. Set all MAIL\_\* variables.
2. Restart the server.
3. Look for: `Email transporter verified (real credentials).`
4. Trigger send and check the real inbox.

### Quick Smoke Test Script

You can run the bundled script (uses Ethereal if real creds missing):

```bash
npx ts-node --compiler-options '{"module":"CommonJS"}' scripts/smoke-email.ts
```

### Troubleshooting

| Symptom                  | Likely Cause                                                      | Fix                                                         |
| ------------------------ | ----------------------------------------------------------------- | ----------------------------------------------------------- |
| Log-only mode            | Missing MAIL\_\* vars and Ethereal creation failed (e.g. network) | Provide real SMTP vars or fix network to api.nodemailer.com |
| Auth failed              | Wrong MAIL_USER/MAIL_PASS                                         | Regenerate or update credentials                            |
| No preview URL           | Running in real SMTP mode                                         | This is expected                                            |
| Links point to localhost | Set `APP_BASE_URL` to your deployed frontend                      |
| Spam folder              | Missing SPF/DKIM                                                  | Configure domain DNS + provider DKIM                        |

### Security Notes

- Tokens are one per role; treat email links as sensitive.
- Consider adding a short expiry (already 7 days) and ability to revoke.
- For production, enable DKIM + SPF for better deliverability.

### Future Enhancements (Optional)

- Queue + retry (Bull / Redis)
- Provider abstraction (SES / SendGrid / Postmark)
- Template theming and localization
- Delivery metrics & bounce handling

---
