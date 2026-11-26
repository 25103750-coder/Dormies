# Dormies code guide

This guide is for the whole team so everybody can explain the code. Every source file also starts with a short
"FILE / PART OF / WHAT IT DOES" comment, and the functions have a one-line comment above them.

## 1. What the system is

Dormies is a web based dormitory management system with three roles (Administrator, Staff, Resident).
It has three parts:

| Part | Technology | Folder |
|---|---|---|
| Front end (what the user sees) | ReactJS + Vite + React Router + our own CSS | `frontend/` |
| Back end (the rules and the API) | Node.js + Express.js | `backend/` |
| Database | MySQL, accessed with Prisma | `backend/prisma/schema.prisma`, `database/` |

## 2. How one click travels through the system

Example: Staff clicks **Record payment** on the Billing page.

1. **Page** (`pages/Billing.jsx`, `PayModal`) collects the amount and calls `api.post('/billing/payments', ...)`.
2. **`services/api.js`** adds the login token and sends the request to `/api/billing/payments`.
3. **`app.js`** receives it and hands it to **`routes/billing.routes.js`**.
4. **`middleware/auth.js`**: `authenticate` checks the token and that the account is active, `authorize` checks the role.
5. The route calls **`services/payments.service.js`** (`record`), which applies the rules (confirmed bill, reference number
   for bank transfers, date not in the future, overpayment needs a confirmation).
6. The service saves with **`config/db.js`** (Prisma, MySQL) inside a transaction, writes the **audit log** and a **notification**.
7. If something is wrong the service throws an **`AppError`**, and **`middleware/errorHandler.js`** sends a clear message.
8. The answer goes back as JSON, and the page shows a message and reloads the table.

## 3. Who can do what (final rules)

| Area | Administrator | Staff | Resident |
|---|---|---|---|
| Residents | view, archive, restore | add, edit, view | own information only |
| Bed assignment and move-out | view | assign, move out | no |
| Rooms and beds | add, edit, delete | view | no |
| Utility bills | generate, confirm, delete drafts, reminders | generate drafts | view own bills |
| Payments | record, view | record, view | view own |
| Security deposit | settle (refunded or forfeited) | no | no |
| Maintenance requests | update status | log for a resident, update status | submit and follow own |
| Room transfers | approve or deny | submit for a resident | submit and follow own |
| Visitor logs | view | check in and out | no |
| Announcements | post, edit, pin, archive, delete | post, edit, pin, archive | read |
| Reports, audit log, backup | yes | no | no |
| Users and system settings | yes | no | no |
| Night mode (Settings > Appearance) | yes | yes | yes |

The server enforces this (routes + `authorize`). The front end only hides buttons that a role cannot use.

## 4. The main flows

**Login.** `Login.jsx` calls `/auth/login`. `auth.service.login` checks the password (bcrypt), counts wrong tries
(3 wrong tries lock the account for 5 minutes) and refuses deactivated accounts. The token is kept in `sessionStorage`
(each browser tab has its own login). Residents go to `/portal`, the others to `/dashboard`.

**Register a resident and give a bed.** Staff use `Residents.jsx`: `residents.service.create` saves the resident, the emergency
contact and the login account. Then **Assign bed** calls `assignments.service.assign` (one active bed per resident, occupied beds are refused).

**Monthly billing.** Staff generate draft bills for a room and month (`billing.service.generate`): rent plus electricity, water and
internet, with the utilities **split equally** between the residents of the room (`splitEqually`). The Admin confirms the drafts
(`confirm`). Only confirmed bills can receive payments. Overdue bills get a late penalty (`refreshOverdue`).

**Payments and overpayment.** `payments.service.record` accepts partial payments. If the amount is more than the balance, the form shows a
warning and the person must tick the confirmation box (the server refuses it otherwise). The bill is then **Paid**, the balance stays
**0**, and the extra is shown as **overpaid** (`overpaid_amount`) on the bill, the statement and the receipt. It is refunded or used for a later bill by hand.

**Move-out.** `assignments.service.moveOut` frees the bed and deactivates the resident account. The deposit stays on hold until the Admin
settles it (`settleDeposit`).

**Room transfer.** A resident (or staff for the resident) submits a request. Only the Admin reviews it: approve moves the resident to the
new bed (`assignments.service.transfer`) and the deposit goes with the resident.

**Night mode.** Settings > Appearance has a switch. `utils/theme.js` saves the choice **per user account** (in the browser) and sets
`data-theme="dark"` on the page; `index.css` has the dark colors. When someone signs in, `AuthContext.jsx` applies **that user's** saved theme,
so the admin's night mode does not change the staff's or the resident's screen.

## 5. The database (18 tables)

Main tables: Resident, Room, Bed, BedAssignment, Bill, Payment, MaintenanceRequest, TransferRequest, VisitorLog, AuditLog.
Supporting tables: Role, User, EmergencyContact, Building, Announcement, AnnouncementRead, Notification, Setting.
They are defined in `backend/prisma/schema.prisma` and `database/schema.mysql.sql` has the same tables as plain SQL.

## 6. File by file

### Back end: starting point

| File | What it is for |
|---|---|
| `backend/src/server.js` | Starts the back end. Checks that the database can be read, fills it with the sample data on the very first run, then listens on the port (5000). |

### Back end: the Express app

| File | What it is for |
|---|---|
| `backend/src/app.js` | Builds the Express app: JSON reading, all /api routes, the 404 for unknown API routes, serving the built front end (frontend/dist) and the error handler. server.js starts it, the tests use it directly. |

### Back end: config

| File | What it is for |
|---|---|
| `backend/src/config/env.js` | Reads backend/.env (DATABASE_URL, JWT_SECRET, PORT...) and gives the rest of the back end one settings object. |
| `backend/src/config/db.js` | The ONLY place that talks to MySQL. Gives db.m (Prisma models), db.all/db.get (raw SQL for reports) and db.tx (a transaction that rolls back when something fails). |
| `backend/src/config/seed.js` | Sample data (the 3 sample accounts, rooms, residents, bills, payments, requests...). Runs on the first start and with npm run seed / npm run reset. |

### Back end: helpers (lib)

| File | What it is for |
|---|---|
| `backend/src/lib/AppError.js` | An error we throw on purpose (404, 409...). The error handler turns it into a JSON message for the front end. |
| `backend/src/lib/dates.js` | Small date helpers (today, now, add days, current period). Dates are kept as plain text in the database. |
| `backend/src/lib/jwt.js` | Creates and checks the login token (JWT). The token holds the user id and role and expires after JWT_EXPIRES_HOURS. |
| `backend/src/lib/password.js` | Hashes passwords with bcrypt, checks a password against its hash, and checks the rule: 8+ characters with letters and numbers. |
| `backend/src/lib/router.js` | An Express router that also catches errors thrown inside async handlers, so a failed query reaches the error handler instead of freezing the request. |
| `backend/src/lib/validate.js` | Checks the data sent by the front end against simple rules (required, max length, email, date...) and returns clean data or a list of field errors. |

### Back end: middleware (runs before the routes)

| File | What it is for |
|---|---|
| `backend/src/middleware/auth.js` | authenticate = who is logged in (checks the token and the account is active). authorize = which roles may use a route. Every protected route uses them. |
| `backend/src/middleware/errorHandler.js` | The last step of every request: turns any error into a clear JSON message and the right status code. |

### Back end: routes (the list of URLs and who may call them)

| File | What it is for |
|---|---|
| `backend/src/routes/auth.routes.js` | Login, who am I, change password, logout. The work is done in auth.service.js. |
| `backend/src/routes/users.routes.js` | Admin only: list, create, edit, deactivate/activate users and reset passwords (users.service.js). |
| `backend/src/routes/residents.routes.js` | Residents and bed assignments. Staff add, edit, assign beds and move residents out; the admin views, archives/restores and settles deposits. |
| `backend/src/routes/rooms.routes.js` | Buildings, rooms and beds. Admin and staff can view; only the admin can add, edit or delete. |
| `backend/src/routes/billing.routes.js` | Bills and payments. Staff generate draft bills and record payments; only the admin confirms or deletes bills and sends reminders. |
| `backend/src/routes/requests.routes.js` | Maintenance and room transfer requests seen by admin and staff. Staff log requests for residents; only the admin approves or denies transfers. |
| `backend/src/routes/visitors.routes.js` | Visitor log. Staff check visitors in and out; the admin can view the log. |
| `backend/src/routes/announcements.routes.js` | Announcements and the notification feed. Admin and staff post and manage announcements; only the admin deletes. Every user reads their own notifications. |
| `backend/src/routes/reports.routes.js` | Dashboards, reports, audit log, backup and restore. Reports, audit and backup are admin only. |
| `backend/src/routes/settings.routes.js` | System settings (curfew, visitor limit, due day, late penalty...). Anyone can read the public name; only the admin can change settings. |
| `backend/src/routes/portal.routes.js` | Everything a Resident can see or send: own overview, own bills, and their own maintenance and transfer requests. |

### Back end: services (the business rules, one file per module)

| File | What it is for |
|---|---|
| `backend/src/services/auth.service.js` | Login rules (3 wrong passwords lock the account for 5 minutes, deactivated accounts are blocked), the current user, and changing the password. |
| `backend/src/services/users.service.js` | User accounts for the admin: create staff accounts, edit, deactivate/activate, reset passwords. |
| `backend/src/services/residents.service.js` | Resident profiles with emergency contact: list/search, view one, register (and create the login account), update, archive and restore. |
| `backend/src/services/assignments.service.js` | Bed assignments: assign a resident to a bed, move-out (frees the bed and deactivates the account), the security deposit, and moving a resident to a new bed. |
| `backend/src/services/rooms.service.js` | Buildings, rooms and beds: add/edit/delete, room and bed status, and keeping the room status in line with its beds. |
| `backend/src/services/billing.service.js` | Utility billing: split the electricity, water and internet equally between the residents of a room, draft bills, confirm, late penalties, balance and overpaid amount, reminders. |
| `backend/src/services/payments.service.js` | Recording payments (cash or bank transfer), receipt numbers, partial payments, and the overpayment rule (needs a confirmation, the extra is kept as overpaid). |
| `backend/src/services/maintenance.service.js` | Maintenance requests: submit (resident or staff for a resident), list, and update the status and the assigned staff. |
| `backend/src/services/transfers.service.js` | Room transfer requests: submit, list, and the admin review (approve moves the resident to the new bed, deny keeps things as they are). |
| `backend/src/services/visitors.service.js` | Visitor log: check in (host must be a current resident, daily limit, curfew warning) and check out. |
| `backend/src/services/announcements.service.js` | Announcements: post, edit, pin, archive, delete, and the list each user can see. |
| `backend/src/services/notification.service.js` | In-app notifications (and the email log) for users, roles or residents: create, list, unread count, mark as read, delivery log. |
| `backend/src/services/email.service.js` | There is no mail server, so emails are written to backend/logs/emails.log. Only this file must change to send real emails. |
| `backend/src/services/portal.service.js` | Everything a resident can see. Every query is filtered by the resident's own id, so a resident can never read someone else's data. |
| `backend/src/services/dashboard.service.js` | Numbers for the admin dashboard and the staff dashboard. |
| `backend/src/services/reports.service.js` | Report numbers for the charts: occupancy, income, collections, maintenance and visitors over a date range. |
| `backend/src/services/settings.service.js` | System settings with default values, read and update. |
| `backend/src/services/audit.service.js` | The audit log: saves who did what (user, action, record, time, IP) and lists the log with filters. |
| `backend/src/services/backup.service.js` | Backup (export all tables to one file) and restore (read that file back). |

### Back end: scripts

| File | What it is for |
|---|---|
| `backend/scripts/make-sql.js` | Builds database/schema.mysql.sql from prisma/schema.prisma (npm run db:sql). Only for people who import the tables by hand. |
| `backend/scripts/setup-test-db.js` | Creates an empty test database before npm test so the tests never touch the real data. |

### Back end: tests

| File | What it is for |
|---|---|
| `backend/tests/api.test.js` | Automated tests (npm test): start the API on a test database and call it like the front end does. They check login, role access, billing, payments, move-out, transfers and more. |

### Database

| File | What it is for |
|---|---|
| `backend/prisma/schema.prisma` | The tables of the system (Prisma). npx prisma db push creates them in MySQL. Matches the data dictionary of the paper. |

### Front end: starting point

| File | What it is for |
|---|---|
| `frontend/src/main.jsx` | Starting point of the React app: puts the app on the page with the router and the login/session context. |
| `frontend/index.html` | The single HTML page. The small script in the head applies the saved night mode before the page is drawn, so there is no white flash. |

### Front end: pages and URLs

| File | What it is for |
|---|---|
| `frontend/src/App.jsx` | The list of pages (URLs). Private pages need a login and the right role; wrong role shows "No access", unknown URL shows "Not found". |

### Front end: layout

| File | What it is for |
|---|---|
| `frontend/src/layouts/AppLayout.jsx` | The frame around every page after login: sidebar menu (different for Admin, Staff and Resident), top bar with the page title, bell and sign out. |

### Front end: context (shared state)

| File | What it is for |
|---|---|
| `frontend/src/context/AuthContext.jsx` | Keeps who is logged in (user), login/logout, the pop-up messages (toast), the unread count, and applies the saved night mode of whoever signs in. |

### Front end: services

| File | What it is for |
|---|---|
| `frontend/src/services/api.js` | All calls to the back end go through here. Adds the login token, turns errors into ApiError, and signs the user out when the session expired. |

### Front end: hooks

| File | What it is for |
|---|---|
| `frontend/src/hooks/useFetch.js` | Loads data when a page opens and keeps the loading and error state, with a reload function. |
| `frontend/src/hooks/usePaged.js` | Splits a list into pages of 10 for the tables. |

### Front end: utils

| File | What it is for |
|---|---|
| `frontend/src/utils/format.js` | Formatting helpers: pesos, dates, times, billing periods, names, CSV download. |
| `frontend/src/utils/forms.js` | useForm keeps the values and errors of a form; showError shows the server's field errors. |
| `frontend/src/utils/theme.js` | Night mode: saves each user's light/dark choice and puts it on the page (see index.css for the colors). |

### Front end: components (reusable parts)

| File | What it is for |
|---|---|
| `frontend/src/components/Charts.jsx` | The line, bar and pie charts (drawn with SVG, no chart library) used in the dashboard and reports. |
| `frontend/src/components/ConfirmDialog.jsx` | The "Are you sure?" pop-up used before confirming or deleting. |
| `frontend/src/components/DataState.jsx` | Shows the right thing while data loads: spinner, error with retry, empty message, or the real content. |
| `frontend/src/components/Field.jsx` | One form field: label, input (or select/textarea) and its error message. |
| `frontend/src/components/Icon.jsx` | The small icons of the menu and buttons, and the Dormies logo. |
| `frontend/src/components/Loader.jsx` | The loading screen (ring spins around a logo that stays still) and the small spinner inside cards. |
| `frontend/src/components/Modal.jsx` | The pop-up window used by all the forms. |
| `frontend/src/components/PageHead.jsx` | Page title and subtitle, with room for the buttons on the right. |
| `frontend/src/components/Pager.jsx` | The page buttons under a table (works with usePaged). |
| `frontend/src/components/ServerError.jsx` | Message with a Retry button when the back end cannot be reached. |
| `frontend/src/components/StatusBadge.jsx` | The colored status label (Paid, Overdue, Pending...). |
| `frontend/src/components/Tabs.jsx` | The tab buttons at the top of a page. |

### Front end: pages (one per screen)

| File | What it is for |
|---|---|
| `frontend/src/pages/Login.jsx` | The login page: username or email and password, shows the server's messages (wrong password, locked account), sends the user to their home page. |
| `frontend/src/pages/Dashboard.jsx` | Home page of Admin (charts and counts for the whole dormitory) and of Staff (their daily tasks). |
| `frontend/src/pages/Residents.jsx` | Resident list. Staff add/edit residents, assign beds and process move-outs; the admin views, archives and restores. |
| `frontend/src/pages/Rooms.jsx` | Rooms and beds: room cards, buildings, and bed status. The admin edits; staff can view and see availability. |
| `frontend/src/pages/Billing.jsx` | Billing & Payments: Bills tab (generate, confirm, record payment, statement), Payments tab (receipts), Security Deposits tab (admin). |
| `frontend/src/pages/Maintenance.jsx` | Maintenance requests for admin and staff: filter by status, log a request for a resident (staff), update the status and who handles it. |
| `frontend/src/pages/Transfers.jsx` | Room transfer requests: staff submit for a resident, the admin approves or denies. |
| `frontend/src/pages/Visitors.jsx` | Visitor log: staff check visitors in and out; the admin views the log. |
| `frontend/src/pages/Reports.jsx` | Reports and charts for the admin (revenue, occupancy, maintenance, collections, visitors) with filters and CSV download. |
| `frontend/src/pages/Announcements.jsx` | Announcements: admin and staff post, edit, pin and archive; only the admin deletes. The admin also sees the email/notification log. |
| `frontend/src/pages/Notifications.jsx` | The notification list of the signed-in user (read, mark all as read). |
| `frontend/src/pages/Settings.jsx` | Settings. Everyone gets Appearance (night mode). The admin also gets users, role permissions, change password, system and billing settings, backup and the audit log. |
| `frontend/src/pages/Portal.jsx` | The Resident pages: home (room, balance, announcements), My Billing (bills, payments, statements) and My Requests (maintenance and transfer). |

## 7. Questions you may be asked (and the short answers)

- **Why are the front end and back end separate?** The React app only shows screens; all rules and security are in the Express API,
  so nobody can skip a rule by editing the browser.
- **How is it secure?** Passwords are hashed with bcrypt, login gives a JWT token, every route checks the token (`authenticate`) and the role
  (`authorize`), accounts lock after 3 wrong tries, and a resident's queries are always filtered by their own id (`portal.service.js`).
- **What does Prisma do?** It describes the tables (`schema.prisma`) and lets the code read and write MySQL without writing SQL for everything.
  `db.js` also has raw SQL for the report queries.
- **Why a transaction (`db.tx`)?** When one action changes several tables (for example a move-out), either everything is saved or nothing is.
- **How are errors handled?** `validate.js` checks the input and returns field errors, services throw `AppError`, `errorHandler.js` turns
  them into clear JSON, and the front end shows them in the form or as a message. If the back end is down, `ServerError` shows a Retry button.
- **Why archive instead of delete?** Billing and payment history must stay, so residents are archived and payments cannot be edited or deleted.
- **What is the audit log?** `audit.service.js` saves who did what and when (logins, payments, edits). The Admin can filter it in Settings.
- **How are utility bills split?** Equally between the active residents of the room (`splitEqually` keeps the centavos exact).
- **How do the three roles see different menus?** `AppLayout.jsx` has a menu list per role and `App.jsx` blocks pages for the wrong role.
- **How does night mode work?** See section 4: one attribute on the page switches the CSS colors, saved per user account.

## 8. Run and test

```
cd backend   ->  npm install, copy .env.example to .env, npx prisma db push, npm start     (API on port 5000)
cd frontend  ->  npm install, npm run dev                                                   (site on http://localhost:5173)
cd backend   ->  npm test                                                                   (17 API tests on a test database)
```
