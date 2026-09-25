<div align="center">

# E-Learning API

**REST API and realtime backend for an online course marketplace**

[![Node.js](https://img.shields.io/badge/Node.js-20-3c873a?style=flat-square&logo=node.js)](https://nodejs.org)
[![Express](https://img.shields.io/badge/Express-4-404040?style=flat-square&logo=express&logoColor=white)](https://expressjs.com)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-47A248?style=flat-square&logo=mongodb&logoColor=white)](https://mongoosejs.com)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-4-010101?style=flat-square&logo=socket.io&logoColor=white)](https://socket.io)
[![Stripe](https://img.shields.io/badge/Stripe-Payments-635BFF?style=flat-square&logo=stripe&logoColor=white)](https://stripe.com)
[![Swagger](https://img.shields.io/badge/API_Swagger-85EA2D?style=flat-square&logo=swagger&logoColor=black)](https://swagger.io)

Frontend: [E-learning-front](https://github.com/mohamed-helmy22020/E-learning-front) · Live app: [e-learning-front-three.vercel.app](https://e-learning-front-three.vercel.app)

</div>

## Overview

This repository holds the backend for a full-stack e-learning platform where instructors publish
video courses, students buy them with Stripe, and take notes, track progress, rate courses and
chat with instructors in realtime.

This service is the API layer only. The user interface lives in a separate repository,
[**E-learning-front**](https://github.com/mohamed-helmy22020/E-learning-front) — a Next.js 14 app
(Tailwind, shadcn/ui, `next-intl` for Arabic/English) that talks to this API over REST and
Socket.IO.

| | Repository |
| --- | --- |
| Backend (this repo) | [`mohamed-helmy22020/E-learning-back`](https://github.com/mohamed-helmy22020/E-learning-back) |
| Frontend | [`mohamed-helmy22020/E-learning-front`](https://github.com/mohamed-helmy22020/E-learning-front) |
| Deployed API | [elearning.vercel.app](https://elearning.vercel.app/api) |
| Deployed web app | [e-learning-front-three.vercel.app](https://e-learning-front-three.vercel.app) |

> [!NOTE]
> There is no `role` field. A user becomes an instructor simply by owning at least one course, and
> every other registered account is treated as a student.

## Features

- **Accounts** — registration, login, JWT bearer auth, email verification codes, and password reset by emailed code.
- **Course catalogue** — create and update courses with an uploaded picture and intro video, browse, search by category, and manage favourites.
- **Lectures** — per-course lecture lists with video and thumbnail uploads, single-lecture lookup, and playback progress tracking.
- **Payments** — Stripe PaymentSheet with ephemeral keys, coupon discounts, and webhook-driven enrollment.
- **Coupons** — per-course discount codes with usage limits and expiry dates.
- **Notes** — timestamped student notes attached to a specific second of a lecture.
- **Ratings** — 1–5 star voting with a rolling average kept on the course.
- **Realtime** — Socket.IO namespaces for student↔instructor chat and push notifications.
- **Notifications** — persisted records for new lectures and course purchases, emitted live to the recipient.
- **Progress** — watched-lecture tracking per user, aggregated into per-course progress.
- **Docs** — OpenAPI spec served through Swagger UI at `/api-docs`.

## Tech stack

- **Runtime** Node.js + Express 4, CommonJS
- **Database** MongoDB via Mongoose 5
- **Realtime** Socket.IO 4 (namespaces `/api/chat`, `/api/notification`)
- **Auth** JWT (`jsonwebtoken`) + `bcryptjs`
- **Payments** Stripe (PaymentSheet + ephemeral keys + webhooks)
- **Media** Cloudinary (images and video via `multer` memory storage)
- **Mail** Nodemailer over Gmail SMTP
- **Docs** OpenAPI 3.0 in `docs/swagger.yaml`, rendered with `swagger-ui-express`
- **Security** `helmet`, `cors`, `xss-clean`, `express-rate-limit`
- **Hosting** Vercel (`@vercel/node`)

## Project structure

```
.
├── app.js                # Express app, middleware, routers, Socket.IO bootstrap
├── config/               # Cloudinary, Nodemailer, Socket.IO instance registry
├── controllers/          # Request handlers (auth, course, lecture, payment, chat, …)
├── db/connect.js         # MongoDB connection
├── docs/swagger.yaml     # OpenAPI specification
├── errors/               # Custom error classes used by the error handler
├── middleware/           # JWT authentication, upload validation, 404, error handler
├── models/               # Mongoose schemas
├── public/               # HTML email templates
├── routes/               # Express routers mounted under /api
├── sockets/              # Socket.IO namespaces
├── utils/                # Rating average, random code generation
├── .env                  # Local secrets (not committed)
└── vercel.json           # Vercel build config
```

## Getting started

### Prerequisites

- Node.js 18 or newer (Node 20 LTS recommended)
- A MongoDB database — local, Atlas, or any hosted instance
- Optional, feature-dependent: a [Cloudinary](https://cloudinary.com) account for media, a
  [Stripe](https://stripe.com) account for payments, and a Gmail account with an app password for email

### Install

```bash
git clone https://github.com/mohamed-helmy22020/E-learning-back.git
cd E-learning-back
npm install
```

### Configure

Create a `.env` file in the project root and fill in the values:

| Variable | Required | Description |
| --- | --- | --- |
| `MONGO_URI` | yes | MongoDB connection string |
| `ACCESS_TOKEN_SECRET` | yes | Secret used to sign and verify JWTs |
| `SERVER_URL` | yes | Public base URL of this API, used for the Swagger server entry (e.g. `http://localhost:5000`) |
| `JWT_EXPIRES_IN` | no | Reserved for token expiry — not yet applied to `createAccessToken()` |
| `EMAIL_USER` | for email | Gmail address used as the SMTP sender |
| `EMAIL_PASS` | for email | Gmail app password |
| `CLOUDINARY_CLOUD_NAME` | for media | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | for media | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | for media | Cloudinary API secret |
| `STRIPE_SECRET_KEY` | for payments | Stripe secret key |
| `STRIPE_PUBLISHABLE_KEY` | for payments | Stripe publishable key, consumed by the frontend |
| `STRIPE_WEBHOOK_SECRET` | for payments | Signing secret for the `checkout.session.completed` event |

> [!IMPORTANT]
> `.env` is gitignored — never commit real credentials. On Vercel, add the same variables under
> **Project Settings → Environment Variables** instead.

### Run

| Command | Description |
| --- | --- |
| `npm run devStart` | Development server with nodemon (watches `.js` and `.yaml`) |
| `npm start` | Production server |
| `npm run vercelDev` | Reproduce the Vercel runtime locally on port 5000 |

The server starts on `PORT` (default `5000`) and only begins listening once the database
connection succeeds.

```
Server is listening on http://localhost:5000/
Swagger docs available at http://localhost:5000/api-docs
```

### Run the frontend

```bash
git clone https://github.com/mohamed-helmy22020/E-learning-front.git
cd E-learning-front
npm install
npm run dev
```

The frontend expects the API on `http://localhost:5000` and the Socket.IO handshake to allow
`http://localhost:3000`.

> [!TIP]
> Follow the [E-learning-front README](https://github.com/mohamed-helmy22020/E-learning-front#readme)
> for its own configuration, including the `NEXT_PUBLIC_BASE_URL` variable.

## API

All routes are mounted under `/api` and, unless noted, require a JWT bearer token.

```http
Authorization: Bearer <accessToken>
```

Errors are returned as `{ "msg": "..." }` with a matching HTTP status code.

### Auth — `/api/auth`

| Method | Path | Description |
| --- | --- | --- |
| `POST` | `/auth/register` | Create an account, returns a user object and access token |
| `POST` | `/auth/login` | Log in with email and password |
| `POST` | `/auth/send-reset-code` | Email a password reset code |
| `POST` | `/auth/reset-password` | Reset the password with a valid code |

### Verification — `/api/verify`

| Method | Path | Description |
| --- | --- | --- |
| `POST` | `/verify/send/email` | Send an email verification code |
| `POST` | `/verify/email` | Verify the email with the code |

### User — `/api/user`

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/user/data` | Current user profile |
| `POST` | `/user/data` | Update profile — `multipart/form-data`, field `profilePicture` |
| `GET` | `/user/uploaded-courses` | Courses owned by the user |
| `GET` | `/user/enrolled-courses` | Courses the user has purchased |

### Courses — `/api/courses`

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/courses` | List courses, filterable by category |
| `POST` | `/courses` | Create a course — fields `coursePicture`, `courseOverview` |
| `PATCH` | `/courses` | Update a course — same file fields |
| `GET` | `/courses/:courseId` | Course details |
| `GET` | `/courses/uploaded-course/:courseId` | Course with instructor-specific data |
| `GET` | `/courses/instructor/:instructorId` | Courses by instructor |
| `GET` | `/courses/fav` | Favourite courses |
| `POST` | `/courses/fav/:courseId` | Add a course to favourites |
| `DELETE` | `/courses/fav/:courseId` | Remove a course from favourites |
| `POST` | `/courses/vote/:courseId` | Rate a course from 1 to 5 |
| `GET` | `/courses/progress` | Progress summary for enrolled courses |

### Lectures — `/api/lectures`

| Method | Path | Description |
| --- | --- | --- |
| `POST` | `/lectures` | Lectures of a course (body carries `courseId`) |
| `POST` | `/lectures/create` | Create a lecture — fields `video`, `thumbnail` |
| `PATCH` | `/lectures` | Update a lecture — same file fields |
| `GET` | `/lectures/:lectureId` | Lecture details |
| `POST` | `/lectures/progress/:lectureId` | Record watched duration and completion |

### Payments — `/api/payments`

| Method | Path | Description |
| --- | --- | --- |
| `POST` | `/payments/payment-sheet` | Create a PaymentSheet for a course, applying a coupon if given |
| `POST` | `/payments/webhook` | Stripe webhook — raw body, signature verified, enrolls the student |

### Coupons — `/api/coupons`

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/coupons/get-course-coupons/:courseId` | Coupons available for a course |
| `POST` | `/coupons/get-coupon-data` | Validate a coupon code |
| `POST` | `/coupons/create` | Create a coupon |
| `DELETE` | `/coupons/delete` | Delete a coupon |

### Notes — `/api/notes`

| Method | Path | Description |
| --- | --- | --- |
| `POST` | `/notes` | Create a note at a video timestamp |
| `GET` | `/notes/get-lecture-notes/:lectureId` | Notes for a lecture |
| `PATCH` | `/notes/:noteId` | Edit a note |
| `DELETE` | `/notes/:noteId` | Delete a note |

### Notifications — `/api/notifications`

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/notifications` | Notifications for the current user |
| `POST` | `/notifications/see/:notificationId` | Mark one as seen |
| `POST` | `/notifications/see-all` | Mark all as seen |

### Swagger

Interactive documentation is served from `docs/swagger.yaml` at
**[/api-docs](http://localhost:5000/api-docs)**. The server entry is rewritten at startup from
`SERVER_URL`, so the same spec renders correctly in every environment.

> [!NOTE]
> The spec covers the auth, verification, user, course, lecture, payment, coupon and note routes.
> Favourites, ratings, progress, notifications and the chat namespace are implemented in code but
> not yet described in the YAML file.

## Realtime

Socket.IO runs on the same HTTP server. Two namespaces are registered in `sockets/`:

| Namespace | Purpose |
| --- | --- |
| `/api/chat` | Private student↔instructor conversations |
| `/api/notification` | Push notifications for new lectures and purchases |

Both authenticate the handshake with `io.engine.use(authenticateUser)`, which expects the same
bearer token used for REST, sent as an `Authorization: Bearer <token>` handshake header.

**Chat events**

| Direction | Event | Payload |
| --- | --- | --- |
| → server | `instructorsList` | — |
| → server | `getConversations` | — |
| → server | `getConversation` | other user's id |
| → server | `getConversationMessages` | other user's id |
| → server | `sendMessage` | recipient id, message text |
| ← client | `instructorsList`, `getConversations`, `getConversation`, `getConversationMessages` | matching data |
| ← client | `receiveMessage` | incoming message |
| ← client | `errors` | error message |

Each socket joins a personal room named `user:<userId>`, which is how targeted notifications and
messages are delivered.

> [!WARNING]
> Browsers cannot set custom headers on a WebSocket handshake, and `extraHeaders` is honoured only
> by the Node.js Socket.IO client. A browser client therefore needs a proxy that injects the
> `Authorization` header, or the authentication step needs to move to the `auth` payload.

## Media uploads

Files are received as `multipart/form-data` through `multer` using in-memory storage and streamed
to Cloudinary, so nothing is written to the local filesystem.

| Field | Type | Limit |
| --- | --- | --- |
| `profilePicture`, `coursePicture` | JPEG, PNG, GIF | 5 MB |
| `thumbnail` | JPEG, PNG, GIF | 5 MB |
| `video`, `courseOverview` | MP4, MOV, AVI, MKV, WEBM | 100 MB |

Cloudinary returns a `public_id`; the API stores the derived playback URL on the document and
transcodes video for streaming.

## Payments

Purchases use Stripe PaymentSheet with [ephemeral keys](https://docs.stripe.com/payments/accept-a-payment?platform=web&ui=payment-sheet),
so no card data ever reaches this server. A Stripe customer is created lazily on the user's first
purchase and stored as `stripeCustomerId`.

The flow is:

1. `POST /api/payments/payment-sheet` validates the course and coupon, then returns the client secret.
2. The frontend confirms payment with Stripe.js.
3. Stripe calls `POST /api/payments/webhook`, which verifies the signature against `STRIPE_WEBHOOK_SECRET`, enrolls the student, increments the student count, and notifies the instructor in realtime.

For local testing, forward Stripe events to your machine:

```bash
stripe listen --forward-to localhost:5000/api/payments/webhook
```

Copy the resulting `whsec_…` signing secret into `STRIPE_WEBHOOK_SECRET`.

> [!IMPORTANT]
> The webhook route reads the raw request body (`express.raw`) because Stripe signature
> verification fails on re-serialized JSON. Keep that middleware in place if you refactor the
> router.

## Deployment

The API is deployed to Vercel as a serverless function — `vercel.json` builds `app.js` with
`@vercel/node` and routes every request to it.

```bash
npm i -g vercel
vercel
```

Set the environment variables from the table above in the Vercel project, including
`SERVER_URL=https://your-deployment.vercel.app` so the Swagger server entry stays correct.

> [!NOTE]
> Vercel's Node runtime has no persistent filesystem, which is why all media goes straight to
> Cloudinary. WebSocket support depends on your Vercel plan; check that realtime namespaces are
> reachable in the deployed environment.

## Security

- Passwords are hashed with bcrypt (10 salt rounds) through a Mongoose pre-save hook.
- `helmet` sets secure headers, `xss-clean` sanitizes input, and `cors` is enabled.
- Rate limiting allows 100 requests per minute per IP; `trust proxy` is enabled for this.
- `express-async-errors` forwards rejected promises to the central error handler.
- JWT payloads carry only `userId` and `email`, and the user is reloaded from the database on every authenticated request.

> [!TIP]
> `cors()` is currently wide open and the rate limit is global. Narrow both before exposing the
> service beyond your own frontend domain.

## Resources

- [REST architecture pattern followed here](https://github.com/kenwheeler/saas-boilerplate)
- [Express documentation](https://expressjs.com)
- [Mongoose documentation](https://mongoosejs.com)
- [Socket.IO documentation](https://socket.io/docs/v4/)
- [Stripe PaymentSheet](https://docs.stripe.com/payments/accept-a-payment?platform=web&ui=payment-sheet)
- [Cloudinary Node.js SDK](https://cloudinary.com/documentation/node_integration)
- [OpenAPI specification](https://swagger.io/specification/)
